#!/bin/sh
set -eu

#===============================================================================
# guider 장시간 측정 스크립트
#
# 목적
#   - guider 를 오래 돌릴 때 guider 자체의 메모리(PSS/RSS) 증가를 억제한다
#   - 동시에 측정 로그를 유실 없이 안정적으로 저장한다
#
# 방식: "사이클 분할" (guider -R 옵션)
#   guider 는 측정 데이터를 메모리 버퍼에 쌓아두고 종료 시 한 번에 파일로 쓴다
#   (기본 buffer size unlimited → 실측 약 1MB/분 증가).
#   그래서 한 프로세스를 계속 돌리는 대신 INTERVAL 마다 guider 를 갈아탄다.
#     guider top -eS -o <파일> -R <INTERVAL>m
#   사이클 종료는 이 스크립트의 자체 타이머가 SIGINT 로 끊는다(정확한 벽시계 기준).
#   -R 은 백스톱이다: 스크립트가 비정상 종료해도 guider 가 방치되지 않고
#   스스로 저장하고 끝나도록 하는 안전장치.
#   ※ -R <N>m 은 "1초 샘플 60*N 개"로 해석되는데(top 모드, -i 미지정 시)
#     실제 샘플 1회에 약 1.8초가 걸려(단말 부하에 따라 변동) 요청보다 늦게 끝난다.
#     그래서 정확한 분할은 자체 타이머가 담당한다. (실측: -R 1m → 실제 1분 55초)
#   → 사이클마다 메모리가 초기값(약 17MB)으로 돌아가고,
#     각 사이클 파일은 그 자체로 완결된 정상 리포트가 된다.
#     (실측: 1분 사이클 3회 연속 - 각 파일 약 1.6MB / 샘플 60개, 메모리 17MB 유지)
#
#   ※ Ctrl+\(SIGQUIT) 방식은 쓰지 않는다.
#      guider 3.9.8 실측 결과 SIGQUIT 은 부모의 버퍼를 비우지만
#      포크된 자식이 쓴 스냅샷 파일에는 샘플 데이터가 들어가지 않아
#      (헤더 42KB, [Time:] 마커 0개) 그 구간 데이터가 사라진다.
#      메모리도 줄지 않았다 (21,104kB → 21,128kB).
#
# 사용법
#   ./guider_longrun.sh <로그저장이름> [사이클_분]
#
#   예) ./guider_longrun.sh wayland          # 30분 단위
#       ./guider_longrun.sh wayland 10       # 10분 단위
#
# 종료
#   Ctrl+C → 현재 guider 에 SIGINT 전송 → 저장 완료까지 대기 → end 파일 기록 → 종료
#   (강제 종료(TERM/KILL)는 하지 않는다. guider 를 강제로 죽이면 저장 전 버퍼가
#    통째로 사라져 그 사이클 데이터를 영구히 잃는다.)
#
# 산출물
#   <이름>_<시각>_start.txt     시작 시점 프로세스 목록
#   <이름>_<시각>_end.txt       종료 시점 프로세스 목록
#   <이름>_<시각>_NNN.out       사이클별 guider 리포트 (완결된 파일)
#   <이름>_<시각>_NNN.guiderlog 사이클별 guider 콘솔 출력
#   <이름>_<시각>_monitor.log   사이클/메모리 추이 기록
#===============================================================================

OUT_DIR="${OUT_DIR:-.}"
GUIDER_BIN="${GUIDER_BIN:-/usr/bin/guider}"

# guider 실행 옵션 (평소 사용하는 형태: guider top -eS -o <파일>)
GUIDER_OPTS="${GUIDER_OPTS:-top -eS}"

DEFAULT_INTERVAL_MIN=30

# 프로세스 목록 필터
PS_FILTER="${PS_FILTER:-webappmanager}"

# guider 저장 완료 대기 상한(초). 초과해도 강제 종료하지 않고 경고만 한다
GUIDER_STOP_WAIT_SEC="${GUIDER_STOP_WAIT_SEC:-300}"

# 메모리 경고 임계값(MB). 사이클 중 이 값을 넘으면 경고
GUIDER_MEM_WARN_MB="${GUIDER_MEM_WARN_MB:-300}"

# 메모리 기록 주기(초)
MEM_LOG_SEC="${MEM_LOG_SEC:-60}"

ESC=$(printf '\033')

GUIDER_PID=""
GUIDER_PY_PID=""
CUR_GLOG=""
GUIDERLOG_SHOWN=0
STOP_REQUESTED=0
CYCLE=0

#------------------------------------------------------------------------------
# 공용 출력
#------------------------------------------------------------------------------
usage() {
    prog=$(basename "$0")
    cat <<EOF
========================================
 guider 장시간 측정 스크립트
========================================
Usage:
  ./${prog} <로그저장이름> [사이클_분]

Example:
  ./${prog} wayland             # 30분 단위로 파일 분할
  ./${prog} wayland 10          # 10분 단위로 파일 분할

Description:
  - 시작 시 'ps -ef | grep ${PS_FILTER}' 결과를 <이름>_<시각>_start.txt 에 기록
  - 사이클_분 마다 guider 에 SIGINT 를 보내 정상 저장시키고 새 guider 로 교체
    → guider 메모리가 사이클마다 초기화되어 장시간 측정에도 증가하지 않음
    → 각 사이클 파일은 그 자체로 완결된 정상 리포트
    (-R 은 스크립트가 죽어도 guider 가 방치되지 않게 하는 백스톱)
  - Ctrl+C 시 현재 guider 에 SIGINT 를 보내고 저장 완료까지 기다린 뒤
    'ps -ef | grep ${PS_FILTER}' 결과를 <이름>_<시각>_end.txt 에 기록하고 종료

Environment:
  OUT_DIR              결과 저장 경로 (기본 .)
  GUIDER_BIN           guider 경로 (기본 /usr/bin/guider)
  GUIDER_OPTS          guider 옵션 (기본 "top -eS")
  PS_FILTER            프로세스 필터 (기본 webappmanager)
  GUIDER_STOP_WAIT_SEC 저장 완료 대기 상한 초 (기본 300)
  GUIDER_MEM_WARN_MB   메모리 경고 임계값 MB (기본 300)
========================================
EOF
}

log() {
    echo "[$(date '+%F %T')] $*"
}

print_line() {
    echo "========================================"
}

monitor() {
    printf '%s %s\n' "$(date '+%F %T')" "$*" >> "${MONITOR_FILE}"
}

log_mon() {
    log "$*"
    monitor "$*"
}

format_hms() {
    _t="$1"
    printf '%02d:%02d:%02d' "$(( _t / 3600 ))" "$(( _t % 3600 / 60 ))" "$(( _t % 60 ))"
}

#------------------------------------------------------------------------------
# 인자 처리
#------------------------------------------------------------------------------
if [ "$#" -lt 1 ] || [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
    usage
    if [ "$#" -lt 1 ]; then
        exit 1
    fi
    exit 0
fi

NAME="$1"
INTERVAL_MIN="${2:-$DEFAULT_INTERVAL_MIN}"

case "${INTERVAL_MIN}" in
    ''|*[!0-9]*)
        echo "ERROR: 사이클_분 은 양의 정수여야 합니다: ${INTERVAL_MIN}"
        exit 1
        ;;
esac
[ "${INTERVAL_MIN}" -gt 0 ] || { echo "ERROR: 사이클_분 은 1 이상이어야 합니다."; exit 1; }

SAFE_NAME=$(echo "${NAME}" | tr ' /:' '___' | tr -cd '[:alnum:]_.-')
[ -n "${SAFE_NAME}" ] || { echo "ERROR: 사용할 수 없는 로그저장이름입니다: ${NAME}"; exit 1; }

if [ ! -x "${GUIDER_BIN}" ]; then
    echo "ERROR: guider 실행 파일이 없습니다: ${GUIDER_BIN}"
    exit 1
fi

mkdir -p "${OUT_DIR}"

TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BASE="${OUT_DIR}/${SAFE_NAME}_${TIMESTAMP}"
START_FILE="${BASE}_start.txt"
END_FILE="${BASE}_end.txt"
MONITOR_FILE="${BASE}_monitor.log"
INTERVAL_SEC=$(( INTERVAL_MIN * 60 ))

#------------------------------------------------------------------------------
# 프로세스 상태 판정 / PID 해석
#------------------------------------------------------------------------------
# 좀비(Z)는 '종료됨' 으로 판정한다. 우리 자식(런처)은 wait 로 수거하기 전까지
# 좀비로 남아 kill -0 이 계속 성공하기 때문이다.
proc_alive() {
    [ -n "${1:-}" ] || return 1
    kill -0 "$1" 2>/dev/null || return 1
    [ -r "/proc/$1/stat" ] || return 0
    _state=$(sed -e 's/^.*) //' -e 's/ .*//' "/proc/$1/stat" 2>/dev/null || echo 'Z')
    [ "${_state}" != "Z" ]
}

# 실제 guider(python) PID 찾기.
# /usr/bin/guider 는 셸 런처이고 exec 없이 "$PYTHON -m guider "$@"" 를 호출한다.
# 따라서 $! 는 런처 셸 PID 이고 실제 guider 는 그 자식이다.
# SIGINT 는 python 쪽(guider.py 의 SysMgr.stopHandler)에서만 처리되므로
# 런처에 신호를 보내면 저장이 시작되지 않는다.
resolve_guider_py_pid() {
    _child=$(ps -eo pid=,ppid= 2>/dev/null \
             | awk -v p="${GUIDER_PID}" '$2 == p { print $1; exit }')
    if [ -n "${_child}" ]; then
        GUIDER_PY_PID="${_child}"
    else
        GUIDER_PY_PID="${GUIDER_PID}"
    fi
}

# guider 메모리 사용량(kB). PSS 를 우선 사용하고 없으면 RSS 로 대체
guider_mem_kb() {
    [ -n "${GUIDER_PY_PID}" ] || { echo 0; return 0; }
    if [ -r "/proc/${GUIDER_PY_PID}/smaps_rollup" ]; then
        _m=$(awk '/^Pss:/ { print $2; exit }' "/proc/${GUIDER_PY_PID}/smaps_rollup" 2>/dev/null || true)
        if [ -n "${_m}" ]; then
            echo "${_m}"
            return 0
        fi
    fi
    _m=$(awk '/^VmRSS:/ { print $2; exit }' "/proc/${GUIDER_PY_PID}/status" 2>/dev/null || true)
    echo "${_m:-0}"
}

#------------------------------------------------------------------------------
# ps 스냅샷
#------------------------------------------------------------------------------
# 사용자 요청 형태: ps -ef | grep <필터> >> <파일>
# (grep 자기 자신 줄만 제외)
write_ps_snapshot() {
    _label="$1"
    _file="$2"
    {
        echo "===== $(date '+%F %T') | ${_label} ====="
        echo "[COMMAND] ps -ef | grep ${PS_FILTER}"
        ps -ef 2>/dev/null | grep -- "${PS_FILTER}" | grep -v ' grep ' || echo "(해당 프로세스 없음)"
        echo ""
    } >> "${_file}"
}

#------------------------------------------------------------------------------
# guider 출력 중계
#------------------------------------------------------------------------------
# guider 는 저장 진행률을 '\r' 로 같은 줄에 덮어쓰고 ANSI 색상코드를 쓴다.
# 줄 단위가 아닌 바이트 오프셋 기준으로 읽고 '\r' 을 개행으로 바꿔 출력한다.
relay_guider_log() {
    [ -n "${CUR_GLOG}" ] && [ -f "${CUR_GLOG}" ] || return 0
    _size=$(wc -c < "${CUR_GLOG}" 2>/dev/null | tr -d ' ')
    [ -n "${_size}" ] || return 0
    [ "${_size}" -gt "${GUIDERLOG_SHOWN}" ] || return 0
    tail -c "+$(( GUIDERLOG_SHOWN + 1 ))" "${CUR_GLOG}" 2>/dev/null \
        | tr '\r' '\n' \
        | sed -e "s/${ESC}\[[0-9;]*m//g" -e '/^[[:space:]]*$/d' \
        | awk '{ print "    guider| " $0 }'
    GUIDERLOG_SHOWN="${_size}"
    return 0
}

#------------------------------------------------------------------------------
# guider 시작 / 종료
#------------------------------------------------------------------------------
start_guider() {
    _out="$1"
    CUR_GLOG="$2"
    GUIDERLOG_SHOWN=0

    # -R <TIME> : 백스톱. 이 스크립트가 죽어도 guider 가 스스로 저장/종료하게 한다.
    #             (정상 경로에서는 아래 자체 타이머의 SIGINT 가 먼저 동작한다)
    # shellcheck disable=SC2086
    "${GUIDER_BIN}" ${GUIDER_OPTS} -o "${_out}" -R "${INTERVAL_MIN}m" > "${CUR_GLOG}" 2>&1 &
    GUIDER_PID=$!
    GUIDER_PY_PID=""

    sleep 3 || true
    if ! proc_alive "${GUIDER_PID}"; then
        log "[WARN] guider 가 즉시 종료되었습니다. 출력:"
        relay_guider_log
        wait "${GUIDER_PID}" 2>/dev/null || true
        GUIDER_PID=""
        return 1
    fi

    resolve_guider_py_pid
    monitor "GUIDER_START|launcher=${GUIDER_PID}|python=${GUIDER_PY_PID}|out=${_out}"
    return 0
}

# guider 종료 대기: SIGINT(정상 저장 경로)만 사용하고 강제 종료하지 않는다
stop_guider() {
    _reason="$1"
    [ -n "${GUIDER_PID}" ] || return 0

    if [ -n "${GUIDER_PY_PID}" ] && proc_alive "${GUIDER_PY_PID}"; then
        # Ctrl+C 는 포그라운드 프로세스 그룹 전체에 전달되므로 guider 가 이미
        # 저장을 시작했을 수 있다. 그 경우 재전송하지 않는다
        # (저장 중 SIGINT 재진입 방지).
        if grep -aq 'start writing' "${CUR_GLOG}" 2>/dev/null; then
            log_mon "guider 가 이미 저장을 시작했습니다 - 추가 신호 없이 완료 대기"
        else
            log_mon "guider(pid=${GUIDER_PY_PID}) 에 SIGINT 전송 (${_reason})"
            kill -INT "${GUIDER_PY_PID}" 2>/dev/null || true
        fi
    fi

    _waited=0
    while [ -n "${GUIDER_PY_PID}" ] && proc_alive "${GUIDER_PY_PID}"; do
        relay_guider_log
        if [ "${_waited}" -ge "${GUIDER_STOP_WAIT_SEC}" ]; then
            echo "[WARN] guider(pid=${GUIDER_PY_PID})가 ${GUIDER_STOP_WAIT_SEC}초 내 저장을 끝내지 못했습니다." >&2
            echo "[WARN] 로그 유실을 막기 위해 강제 종료하지 않습니다 - 저장이 끝나면 스스로 종료됩니다." >&2
            echo "[WARN] 진행 확인: tail -f ${CUR_GLOG}" >&2
            monitor "GUIDER_STOP_TIMEOUT|pid=${GUIDER_PY_PID}|waited=${_waited}s"
            return 0
        fi
        sleep 1 || true
        _waited=$(( _waited + 1 ))
    done

    # python 이 끝나면 런처 셸도 종료된다 - 자식 수거
    _lwait=0
    while proc_alive "${GUIDER_PID}" && [ "${_lwait}" -lt 15 ]; do
        sleep 1 || true
        _lwait=$(( _lwait + 1 ))
    done
    wait "${GUIDER_PID}" 2>/dev/null || true
    relay_guider_log
    monitor "GUIDER_END|saved_wait=${_waited}s"
    GUIDER_PID=""
    GUIDER_PY_PID=""
    return 0
}

#------------------------------------------------------------------------------
# 사이클 결과 확인
#------------------------------------------------------------------------------
report_cycle_file() {
    _out="$1"

    # guider 자신이 남긴 저장 완료 메시지를 확인
    if [ -n "${CUR_GLOG}" ] && [ -f "${CUR_GLOG}" ]; then
        _saved=$(tr '\r' '\n' < "${CUR_GLOG}" 2>/dev/null \
                 | sed -e "s/${ESC}\[[0-9;]*m//g" \
                 | grep -a 'saved the results' | tail -1 || true)
        if [ -n "${_saved}" ]; then
            echo "    guider| ${_saved}"
        fi
    fi

    if [ -f "${_out}" ]; then
        _size=$(wc -c < "${_out}" | tr -d ' ')
        _samples=$(grep -ao '\[Time: [0-9.]*\]' "${_out}" 2>/dev/null | wc -l | tr -d ' ')
        log_mon "사이클 파일 저장 확인: ${_out} (${_size} bytes, 샘플 ${_samples}개)"
    else
        log "[WARN] 사이클 파일이 없습니다: ${_out}"
        monitor "CYCLE_FILE_MISSING|${_out}"
    fi
}

#------------------------------------------------------------------------------
# 종료 처리
#------------------------------------------------------------------------------
FINALIZED=0

finalize() {
    [ "${FINALIZED}" -eq 0 ] || return 0
    FINALIZED=1
    print_line
    log "종료 처리: guider 저장이 끝날 때까지 기다립니다 (진행률이 아래에 표시됩니다)"
    stop_guider "종료 요청"
    if [ -n "${CUR_OUT:-}" ]; then
        report_cycle_file "${CUR_OUT}"
    fi

    log "종료 시점 프로세스 정보 기록: ${END_FILE}"
    write_ps_snapshot "END" "${END_FILE}"
    monitor "END|cycles=${CYCLE}|elapsed=$(format_hms $(( $(date +%s) - START_EPOCH )))"

    print_line
    echo " 측정 종료"
    print_line
    echo " 총 사이클     : ${CYCLE}"
    echo " 총 경과 시간  : $(format_hms $(( $(date +%s) - START_EPOCH )))"
    echo " start 파일    : ${START_FILE}"
    echo " end 파일      : ${END_FILE}"
    echo " monitor 로그  : ${MONITOR_FILE}"
    echo " guider 리포트 :"
    _n=0
    for _f in "${BASE}"_*.out; do
        if [ -f "${_f}" ]; then
            printf '   %10s bytes  %s\n' "$(wc -c < "${_f}" | tr -d ' ')" "${_f}"
            _n=$(( _n + 1 ))
        fi
    done
    if [ "${_n}" -eq 0 ]; then
        echo "   (없음)"
    fi
    print_line
}

on_signal() {
    STOP_REQUESTED=1
    echo ""
    log "종료 신호 수신 - 현재 사이클을 정상 저장한 뒤 종료합니다."
}

on_exit() {
    _rc=$?
    if [ "${FINALIZED}" -eq 0 ] && [ -n "${GUIDER_PID}" ]; then
        echo ""
        log "예상치 못한 종료(코드 ${_rc}) - guider 저장을 마무리합니다."
        finalize || true
    fi
}

trap on_signal INT TERM HUP
trap on_exit EXIT

#------------------------------------------------------------------------------
# 시작
#------------------------------------------------------------------------------
START_EPOCH=$(date +%s)

print_line
echo " guider 장시간 측정 시작"
print_line
echo " 로그 이름     : ${SAFE_NAME}"
echo " 사이클 간격   : ${INTERVAL_MIN}분 마다 저장 후 guider 교체 (-R ${INTERVAL_MIN}m 은 백스톱)"
echo " guider        : ${GUIDER_BIN} ${GUIDER_OPTS} -o <파일> -R ${INTERVAL_MIN}m"
echo " 결과 경로     : ${OUT_DIR}"
echo " start 파일    : ${START_FILE}"
echo " end 파일      : ${END_FILE}"
echo " monitor 로그  : ${MONITOR_FILE}"
print_line
echo " 종료: Ctrl+C  (현재 사이클 저장 완료까지 기다린 뒤 종료합니다)"
print_line

: > "${MONITOR_FILE}"
monitor "START|name=${SAFE_NAME}|interval=${INTERVAL_MIN}m|guider_opts=${GUIDER_OPTS}"

log "시작 시점 프로세스 정보 기록: ${START_FILE}"
write_ps_snapshot "START" "${START_FILE}"

# 이미 실행 중인 guider 경고 (측정값 왜곡 + 메모리 점유)
EXISTING=$(ps -eo pid=,etime=,rss=,args= 2>/dev/null | grep -- '-m guider' | grep -v ' grep ' || true)
if [ -n "${EXISTING}" ]; then
    echo "[WARN] 이미 실행 중인 guider 가 있습니다. 측정값이 왜곡될 수 있습니다:" >&2
    printf '%s\n' "${EXISTING}" | sed 's/^/         /' >&2
    echo "[WARN] 정리(저장 후 종료): kill -INT <PID>   ※ kill -9 는 로그가 유실됩니다" >&2
    monitor "PRE_EXISTING_GUIDER_FOUND"
fi

#------------------------------------------------------------------------------
# 메인 루프: 사이클마다 guider 를 새로 띄운다
#------------------------------------------------------------------------------
FAST_FAIL=0

while [ "${STOP_REQUESTED}" -eq 0 ]; do
    CYCLE=$(( CYCLE + 1 ))
    SEQ=$(printf '%03d' "${CYCLE}")
    CUR_OUT="${BASE}_${SEQ}.out"
    CUR_LOG="${BASE}_${SEQ}.guiderlog"

    log_mon "[사이클 ${SEQ}] 시작 (${INTERVAL_MIN}분) → ${CUR_OUT}"

    if ! start_guider "${CUR_OUT}" "${CUR_LOG}"; then
        FAST_FAIL=$(( FAST_FAIL + 1 ))
        log "[WARN] guider 시작 실패 (${FAST_FAIL}회)"
        if [ "${FAST_FAIL}" -ge 3 ]; then
            echo "ERROR: guider 시작이 3회 연속 실패했습니다. 중단합니다." >&2
            break
        fi
        sleep 5 || true
        continue
    fi
    FAST_FAIL=0
    relay_guider_log

    CYCLE_START=$(date +%s)
    MEM_MAX_KB=0
    ELAPSED=0
    SAVING=0
    SIGNALED=0

    # guider 가 -R 로 스스로 종료할 때까지 감시
    while proc_alive "${GUIDER_PID}"; do
        [ "${STOP_REQUESTED}" -eq 0 ] || break
        sleep 1 || true
        ELAPSED=$(( $(date +%s) - CYCLE_START ))

        if [ "$(( ELAPSED % MEM_LOG_SEC ))" -eq 0 ]; then
            MEM_KB=$(guider_mem_kb)
            if [ "${MEM_KB}" -gt "${MEM_MAX_KB}" ]; then
                MEM_MAX_KB="${MEM_KB}"
            fi
            monitor "MEM|cycle=${SEQ}|elapsed=${ELAPSED}s|mem=${MEM_KB}kB"
            if [ "${MEM_KB}" -gt "$(( GUIDER_MEM_WARN_MB * 1024 ))" ]; then
                echo "[WARN] guider 메모리 ${MEM_KB}kB (임계값 ${GUIDER_MEM_WARN_MB}MB 초과)" >&2
                monitor "MEM_WARN|cycle=${SEQ}|mem=${MEM_KB}kB"
            fi
        fi

        # 지정한 사이클 시간이 되면 SIGINT 로 저장을 시작시킨다.
        # (-R 백스톱은 샘플 지연 때문에 늦게 동작하므로 벽시계 기준은 여기서 맞춘다)
        if [ "${SIGNALED}" -eq 0 ] && [ "${SAVING}" -eq 0 ] \
           && [ "${ELAPSED}" -ge "${INTERVAL_SEC}" ]; then
            SIGNALED=1
            if [ -t 1 ]; then
                echo ""
            fi
            if grep -aq 'start writing' "${CUR_LOG}" 2>/dev/null; then
                log_mon "[사이클 ${SEQ}] guider 가 이미 저장 중 - SIGINT 생략"
            else
                log_mon "[사이클 ${SEQ}] ${INTERVAL_MIN}분 경과 - guider(pid=${GUIDER_PY_PID}) 에 SIGINT 전송"
                kill -INT "${GUIDER_PY_PID}" 2>/dev/null || true
            fi
        fi

        # 저장이 시작되면 진행률 표시를 멈추고 guider 메시지를 중계한다
        if [ "${SAVING}" -eq 0 ] && grep -aq 'start writing' "${CUR_LOG}" 2>/dev/null; then
            SAVING=1
            if [ -t 1 ]; then
                echo ""
            fi
            log_mon "[사이클 ${SEQ}] guider 저장 시작 (경과 $(format_hms "${ELAPSED}"))"
        fi

        if [ "${SAVING}" -eq 1 ]; then
            relay_guider_log
        elif [ -t 1 ]; then
            printf '\r[사이클 %s] 경과 %s / %s  guider메모리 %sMB   ' \
                "${SEQ}" "$(format_hms "${ELAPSED}")" \
                "$(format_hms "${INTERVAL_SEC}")" \
                "$(( $(guider_mem_kb) / 1024 ))"
        fi
    done
    if [ -t 1 ] && [ "${SAVING}" -eq 0 ]; then
        echo ""
    fi

    if [ "${STOP_REQUESTED}" -eq 1 ]; then
        break
    fi

    # -R 로 스스로 종료한 경우: 저장까지 마치고 자식 수거
    stop_guider "사이클 ${SEQ} 정상 종료"
    report_cycle_file "${CUR_OUT}"
    log_mon "[사이클 ${SEQ}] 완료 (경과 $(format_hms "${ELAPSED}"), guider메모리 최대 $(( MEM_MAX_KB / 1024 ))MB)"
done

finalize
