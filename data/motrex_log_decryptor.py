import os
import glob
import shutil
import zipfile
import gzip
import tempfile
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad

KEY = bytes.fromhex("0DB3C0E73032A4E77565DA3211D1E89F801E718CB38A5019E5CD598F9BD34D80")
IV = bytes.fromhex("2E07EAA1FDFFE3A22A83B3BF752136F6")

def process_enc_content(enc_data, source_name):
    try:
        cipher = AES.new(KEY, AES.MODE_CBC, IV)
        try:
            dec_data = unpad(cipher.decrypt(enc_data), AES.block_size)
        except ValueError:
            print(f"  [X] {source_name} 복호화 실패 (키/패딩 에러)")
            return False

        with tempfile.TemporaryDirectory() as temp_dir:
            dec_zip_path = os.path.join(temp_dir, "decrypted.zip")
            with open(dec_zip_path, 'wb') as f_out:
                f_out.write(dec_data)
            
            extract_dir = os.path.join(temp_dir, "extracted")
            with zipfile.ZipFile(dec_zip_path, 'r') as dec_z:
                dec_z.extractall(extract_dir)
                
            dlt_zip_found = False
            for root, _, files in os.walk(extract_dir):
                for f in files:
                    if f.lower() == 'dlt.zip':
                        dlt_zip_found = True
                        dlt_zip_path = os.path.join(root, f)
                        
                        dlt_extract_dir = os.path.join(temp_dir, "dlt_extracted")
                        with zipfile.ZipFile(dlt_zip_path, 'r') as dlt_z:
                            dlt_z.extractall(dlt_extract_dir)
                        
                        dlt_target_dir = os.path.join(os.getcwd(), "DLT")
                        compress_target_dir = os.path.join(dlt_target_dir, "compress")
                        os.makedirs(dlt_target_dir, exist_ok=True)
                        os.makedirs(compress_target_dir, exist_ok=True)
                        
                        for dlt_root, _, dlt_files in os.walk(dlt_extract_dir):
                            for item in dlt_files:
                                item_path = os.path.join(dlt_root, item)
                                
                                if item.endswith('.dlt'):
                                    # 1. 일반 .dlt 파일은 DLT 폴더로 바로 이동
                                    shutil.move(item_path, os.path.join(dlt_target_dir, item))
                                    print(f"  [+] 추출 완료: DLT/{item}")
                                    
                                elif item.endswith('.dlt.gz'):
                                    # 2. .gz 파일은 압축을 풀어서 알맹이(.dlt)만 compress 폴더에 저장
                                    dlt_name = item[:-3] # .gz 확장자 제거 (알맹이 이름)
                                    dlt_out_path = os.path.join(compress_target_dir, dlt_name)
                                    
                                    with gzip.open(item_path, 'rb') as gz_in:
                                        with open(dlt_out_path, 'wb') as dlt_out:
                                            shutil.copyfileobj(gz_in, dlt_out)
                                            
                                    print(f"  [+] 압축 해제 완료: DLT/compress/{dlt_name}")
                                    # 원본 .gz 파일은 임시 폴더(temp_dir)에 남겨두어 자동 삭제되게 함
            
            if not dlt_zip_found:
                print(f"  [-] {source_name} 내부에 DLT.zip 파일이 없습니다.")
                
        return True

    except Exception as e:
        print(f"  [X] '{source_name}' 처리 중 에러: {e}")
        return False

def process_zip_file(target_zip):
    try:
        with zipfile.ZipFile(target_zip, 'r') as z:
            enc_files = [f for f in z.namelist() if f.endswith('.enc')]
            if not enc_files:
                return False

        print(f"\n[O] '{target_zip}' 분석 시작...")
        
        success = False
        with zipfile.ZipFile(target_zip, 'r') as z:
            for enc_filename in enc_files:
                with z.open(enc_filename) as f_in:
                    enc_data = f_in.read()
                if process_enc_content(enc_data, f"{target_zip}/{enc_filename}"):
                    success = True
        return success
    except Exception as e:
        print(f"[X] '{target_zip}' 에러: {e}")
        return False

def process_enc_file(target_enc):
    print(f"\n[O] '{target_enc}' 분석 시작...")
    try:
        with open(target_enc, 'rb') as f:
            enc_data = f.read()
        return process_enc_content(enc_data, target_enc)
    except Exception as e:
        print(f"[X] '{target_enc}' 에러: {e}")
        return False

def main():
    print("=== DLT 로그 추출 파이프라인 시작 ===")
    
    zip_files = glob.glob("*.zip")
    processed_count = 0
    
    if zip_files:
        for z in zip_files:
            if z.lower() in ['dlt.zip', 'decrypted.zip']: continue
            if process_zip_file(z): processed_count += 1
    
    else:
        enc_files = glob.glob("*.enc")
        if enc_files:
            for enc in enc_files:
                if process_enc_file(enc): processed_count += 1
        else:
            print("처리할 파일이 없습니다.")
            return

    print(f"\n=== 작업 완료 ({processed_count}개 파일 처리됨) ===")

if __name__ == "__main__":
    main()
