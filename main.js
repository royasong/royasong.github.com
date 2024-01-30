/// <reference path="../../src/config.ts" />
/// <reference path="../../src/app-default.ts" />
/// <reference path="../../src/main.ts" />
/// <reference path="../../src/systemsvehicle.ts" />
/// <reference path="../../src/systemsuserprofile.ts" />
/// <reference path="../../src/appspopups.ts" />
/// <reference path="../../src/appsappinput.ts" />
/// <reference path="../../src/appsappmedia.ts" />
/// <reference path="../../src/appsappcontext.ts" />
/// <reference path="../../src/systemsappsnavihmi.ts" />
/// <reference path="../../src/systemsappssetuphmi.ts" />
/// <reference path="../../src/systemstelephony.ts" />
/// <reference path="../../src/systemsappshomehmi.ts" />
/// <reference path="../../src/systemsbluetooth.ts" />
/// <reference path="../../src/appsvoicerecognizer.ts" />
/// <reference path="../../src/appstexttospeech.ts" />
'use strict';
let globalLogger = undefined;
window.onload = function () {
    globalLogger = {
        log: (...args) => {
            console.log('[OverridenLogger]', ...args);
        }
    };
    const _consoleArea = document.getElementById('consoleArea');
    _consoleArea.setAttribute('readOnly', '');
    function printToConsoleArea(...args) {
        let fullLog = '';
        args.forEach(item => {
            if (typeof item === 'object')
                item = JSON.stringify(item);
            fullLog += item + ' ';
        });
        _consoleArea.value += '\n' + fullLog;
        _consoleArea.scrollTop = _consoleArea.scrollHeight;
    }
    const customConsole = (function (originalConsole) {
        return {
            log: function (...args) {
                originalConsole.log(...args);
                printToConsoleArea(...args);
            },
            warn: function (...args) {
                originalConsole.warn(...args);
                printToConsoleArea('[warn]', ...args);
            },
            error: function (...args) {
                originalConsole.error(...args);
                printToConsoleArea('[error]', ...args);
            },
            info: function (...args) {
                originalConsole.info(...args);
                printToConsoleArea('[info]', ...args);
            }
        };
    }(window.console));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window["console"] = customConsole;
    const ccOSBox = document.getElementById('ccOS');
    ccOSBox.appendChild(createUserprofileBox());
    ccOSBox.appendChild(createVehicleBox());
    ccOSBox.appendChild(createVSMBox());
    ccOSBox.appendChild(createPopupsBox());
    ccOSBox.appendChild(createAppInputBox());
    ccOSBox.appendChild(createAppMediaBox());
    ccOSBox.appendChild(createAppContextBox());
    ccOSBox.appendChild(createNavigationBox());
    ccOSBox.appendChild(createSetupHMIBox());
    ccOSBox.appendChild(createTelephonyBox());
    ccOSBox.appendChild(createHomeHMIBox());
    ccOSBox.appendChild(createBluetoothBox());
    ccOSBox.appendChild(createVoiceRecognizerBox());
    ccOSBox.appendChild(createTextToSpeechBox());
    ccOSBox.appendChild(createHeaderBox());
};
function createHeaderBox() {
    var _a;
    const APIs = [];
    (_a = document.body.querySelectorAll('#ccOS > div')) === null || _a === void 0 ? void 0 : _a.forEach(ele => APIs.push(ele.id));
    const toggleBox = FormSet.createElement('div', { id: 'headerBox', className: 'm5', innerText: `ccOS Web API v${ccOS.version}\t` });
    toggleBox.innerText = `ccOS Web API ${(ccOS === null || ccOS === void 0 ? void 0 : ccOS.version) || ''}\t`;
    const setAlert = FormSet.cbSetAlert(toggleBox);
    if (!(ccOS === null || ccOS === void 0 ? void 0 : ccOS.version))
        setAlert('ccOS undefined');
    const createBtn = (name) => {
        const btn = FormSet.createButton({ className: 'm2 btnToggle', innerText: name });
        btn.onclick = (evt) => {
            const apiBox = document.body.querySelector(`#${name}`);
            if (!apiBox) {
                return;
            }
            apiBox.classList.toggle('displayNone');
            evt.target.classList.toggle('hidden');
        };
        toggleBox.appendChild(btn);
    };
    const createToggleAllBtn = () => {
        const btn = FormSet.createButton({ className: 'm2 btnToggle', innerText: 'All' });
        let isShow = true;
        btn.onclick = (evt) => {
            isShow = !isShow;
            const coll = document.querySelectorAll('#headerBox .btnToggle' + (isShow && '.hidden' || ''));
            coll.forEach((target) => {
                if (evt.target === target)
                    return;
                target.click();
            });
            evt.target.classList.toggle('hidden');
        };
        toggleBox.appendChild(btn);
    };
    APIs.forEach(createBtn);
    createBtn('console');
    createToggleAllBtn();
    return toggleBox;
}
function createVSMBox() {
    const box = createBox('vsm');
    const label = FormSet.createElement('label', { id: 'vsmlabel' });
    const btnGetInstance = FormSet.createButton({ innerText: 'getInstance', className: 'm5' });
    const input = FormSet.createElement('input', { id: 'vsminput', type: 'text', value: 'Vehicle.Body', className: 'm5', placeholder: 'id' });
    box.appendChild(input);
    box.appendChild(btnGetInstance);
    const setAlert = FormSet.cbSetAlert(box, label);
    if (!ccOS.VehicleSignalModel)
        setAlert('ccOS.VehicleSignalModel undefined');
    btnGetInstance.onclick = () => {
        var _a, _b;
        const id = (_a = document.getElementById('vsminput')) === null || _a === void 0 ? void 0 : _a.value;
        const elements = document.body.querySelectorAll(`#vsm div[data-id="${id}"`);
        if ((elements === null || elements === void 0 ? void 0 : elements.length) > 0) {
            setAlert(`already exist instance of "${id}"`);
            return;
        }
        label && (label.innerHTML = '');
        (_b = ccOS.VehicleSignalModel) === null || _b === void 0 ? void 0 : _b.getInstance({ id, _debugOptions: { logLevel: ccOS.Logger.TRACE, output: globalLogger } }).then(vsm => {
            log('vsm instance is created', vsm);
            const properties = [
                { name: 'value', type: 'json', initSetInput: true }
            ];
            new TestForm({ instance: vsm, properties, parentElement: box });
        }).catch(e => {
            console.warn(e);
            setAlert(e);
        });
    };
    return box;
}
function createAppContextBox() {
    const box = createBox('appcontext');
    const appInputTestBox = FormSet.createDiv({ id: 'appContextTestBox', className: 'm5' });
    const btnGetInstance = FormSet.createButton({ innerText: 'getInstance', className: 'm5' });
    box.appendChild(btnGetInstance);
    box.appendChild(appInputTestBox);
    const setAlert = FormSet.cbSetAlert(box);
    // usage of ccOS 'appcontext'  [[
    if (!ccOS.AppContext) {
        setAlert('ccOS.AppContext undefined');
    }
    else {
        const getInstance = () => {
            var _a;
            (_a = ccOS.AppContext) === null || _a === void 0 ? void 0 : _a.getInstance({
                _debugOptions: { logLevel: ccOS.Logger.TRACE, output: globalLogger }
            }).then((appcontext) => {
                log('appcontext instance is created', appcontext);
                const methods = [
                    { name: 'clearAppHistory' },
                    { name: 'focusOnSystem' }
                ];
                const properties = [
                    {
                        name: 'behaviorUserBack', type: 'selection', hasSet: false,
                        selection: [ccOS.AppContext.VALUE_BEHAVIOR_USER_BACK_APP_HISTORY_BACK, ccOS.AppContext.VALUE_BEHAVIOR_USER_BACK_NATIVE_BACK]
                    },
                    {
                        name: 'focusOwner', type: 'selection', hasSet: false,
                        selection: [ccOS.AppContext.VALUE_FOCUS_OWNER_APP, ccOS.AppContext.VALUE_FOCUS_OWNER_SYSTEM]
                    }
                ];
                new TestForm({
                    instance: appcontext, properties, methods, parentElement: box,
                    onDestroy: () => {
                        btnGetInstance.disabled = false;
                    }
                });
            }).catch(e => {
                console.warn(e);
                setAlert(e);
            });
        };
        btnGetInstance.onclick = getInstance;
    }
    return box;
}
function createAppMediaBox() {
    const box = createBox('appmedia');
    const appInputTestBox = FormSet.createDiv({ id: 'appMediaTestBox', className: 'm5' });
    const btnGetInstance = FormSet.createButton({ innerText: 'getInstance', className: 'm5' });
    box.appendChild(btnGetInstance);
    box.appendChild(appInputTestBox);
    const setAlert = FormSet.cbSetAlert(box);
    // usage of ccOS 'appmedia'  [[
    if (!ccOS.AppMedia) {
        setAlert('ccOS.AppMedia undefined');
    }
    else {
        const getInstance = () => {
            var _a;
            (_a = ccOS.AppMedia) === null || _a === void 0 ? void 0 : _a.getInstance({
                _debugOptions: { logLevel: ccOS.Logger.TRACE, output: globalLogger }
            }).then((appmedia) => {
                log('appmedia instance is created', appmedia);
                const properties = [
                    {
                        name: 'videoZoom', type: 'selection',
                        selection: [ccOS.AppMedia.VALUE_VIDEO_ZOOM_NORMAL, ccOS.AppMedia.VALUE_VIDEO_ZOOM_ZOOM_FILL_SCREEN],
                        initSetInput: true
                    }
                ];
                new TestForm({ instance: appmedia, properties, parentElement: box });
            }).catch(e => {
                console.warn(e);
                setAlert(e);
            });
        };
        btnGetInstance.onclick = getInstance;
    }
    return box;
}
function createAppInputBox() {
    const box = createBox('appinput');
    const appInputTestBox = FormSet.createDiv({ id: 'appInputTestBox', className: 'm5' });
    const btnGetInstance = FormSet.createButton({ innerText: 'getInstance', className: 'm5' });
    box.appendChild(btnGetInstance);
    box.appendChild(appInputTestBox);
    const setAlert = FormSet.cbSetAlert(box);
    // usage of ccOS 'appinput'  [[
    if (!ccOS.AppInput) {
        setAlert('ccOS.AppInput undefined');
    }
    else {
        const testInput = FormSet.createElement('input', { type: 'text', id: 'txtForTestOfAppInput', placeholder: 'Please enter "a" or "아".' });
        appInputTestBox.appendChild(testInput);
        const koArr = [
            // top 1 ~ 50
            '명량', '극한직업', '신과함께-죄와 벌', '국제시장', '어벤져스: 엔드게임', '겨울왕국 2', '아바타', '베테랑', '괴물', '도둑들', '7번방의 선물', '암살', '범죄도시 2', '알라딘', '광해, 왕이 된 남자', '왕의 남자', '신과함께-인과 연', '택시운전사', '태극기 휘날리며', '부산행', '해운대', '변호인', '어벤져스: 인피니티 워', '실미도', '어벤져스: 에이지 오브 울트론', '기생충', '겨울왕국', '인터스텔라', '보헤미안 랩소디', '검사외전', '엑시트', '설국열차', '관상', '아이언맨 3', '캡틴 아메리카: 시빌 워', '해적: 바다로 간 산적', '수상한 그녀', '국가대표', '디워', '백두산', '과속스캔들', '탑건: 매버릭', '스파이더맨: 파 프롬 홈', '웰컴 투 동막골', '공조', '트랜스포머 3', '히말라야', '미션임파서블:고스트프로토콜', '스파이더맨: 노 웨이 홈', '트랜스포머: 패자의 역습',
            // top 51 ~ 100
            '밀정', '최종병기 활', '트랜스포머', '써니', '화려한 휴가', '한산: 용의 출현', '스파이더맨: 홈 커밍', '1987', '베를린', '마스터', '터널', '어벤져스', '내부자들', '인천상륙작전', '럭키', '은밀하게 위대하게', '공조2: 인터내셔날', '곡성', '범죄도시', '타짜', '좋은 놈, 나쁜 놈, 이상한 놈', '늑대소년', '미녀는 괴로워', '군함도', '미션 임파서블: 폴아웃', '다크 나이트 라이즈', '아저씨', '사도', '전우치', '킹스맨 : 시크릿 에이전트', '미션 임파서블: 로그네이션', '투사부일체', '연평해전', '반지의 제왕 : 왕의 귀환', '인셉션', '레미제라블', '닥터 스트레인지: 대혼돈의 멀티버스', '쉬리', '캡틴 마블', '미션 임파서블 3', '쥬라기 월드: 폴른 킹덤', '청년경찰', '가문의 위기(가문의 영광2)', '숨바꼭질', '덕혜옹주', '더 테러 라이브', '쥬라기 월드', '감시자들', '의형제', '2012'
        ];
        const enArr = [
            // top 1 ~ 100
            'Top Gun: Maverick', 'Doctor Strange in the Multi…', 'Jurassic World: Dominion', 'Black Panther: Wakanda Forever', 'Minions: The Rise of Gru', 'The Batman', 'Thor: Love and Thunder', 'Spider-Man: No Way Home', 'Sonic the Hedgehog 2', 'Black Adam', 'Elvis', 'Uncharted', 'Nope', 'Lightyear', 'Smile', 'The Lost City', 'Bullet Train', 'The Bad Guys', 'Fantastic Beasts: The Secre…', 'DC League of Super Pets', 'Where the Crawdads Sing', 'The Black Phone', 'Sing 2', 'Scream', 'Morbius', 'Everything Everywhere All A…', 'The Woman King', 'Ticket to Paradise', 'Halloween Ends', 'Dog', 'jackass forever', 'Death on the Nile', 'Don’t Worry, Darling', 'Lyle, Lyle, Crocodile', 'Downton Abbey: A New Era', 'Barbarian', 'The Northman', 'Jujutsu Kaisen 0: The Movie', 'Dragon Ball Super: Super Hero', 'The Bob’s Burgers Movie', 'Beast', 'Carnal Knowledge', 'The Invitation', 'Avatar', 'Marry Me', 'Ambulance', 'The King’s Man', 'Father Stu', 'The Unbearable Weight of Ma…', 'The Menu', 'Strange World', 'Prey for the Devil', 'Moonfall', 'Paws of Fury: The Legend of…', 'Amsterdam', 'The 355', 'American Underdog: The Kurt…', 'RRR: Rise, Roar, Revolt', 'Glass Onion: A Knives Out M…', 'The Chosen Season 3: Episod…', 'Easter Sunday', 'One Piece Film: Red', 'Jaws', 'X', 'Bros', 'Bodies Bodies Bodies', 'Licorice Pizza', 'Terrifier 2', 'Mrs. Harris Goes to Paris', 'West Side Story', 'Devotion', 'Blacklight', 'Firestarter', 'See How They Run', 'The Matrix Resurrections', 'Pearl', 'Redeeming Love', 'Till', 'Three Thousand Years of Lon…', 'The Banshees of Inisherin', 'Brahmastra Part 1: Shiva', 'Men', 'Memory', 'Fall', 'Ghostbusters: Afterlife', 'BTS Permission to Dance on …', 'K.G.F: Chapter 2', 'Marcel the Shell with Shoes On', 'Encanto', 'Orphan: First Kill', 'Tucker: The Man and His Dream', 'TÁR', 'Lifemark', 'Ponniyin Selvan: Part One', 'House of Gucci', 'Mississippi Masala', 'She Said', 'The Cursed', 'Bones and All',
            // top 101 ~ 200
            'ET: The Extra-Terrestrial', 'Vengeance', 'Moonage Daydream', 'Clerks III', 'Belle', 'Triangle of Sadness', 'Family Camp', 'The Fabelmans', 'Cyrano', 'Nightmare Alley', 'Laal Singh Chaddha', 'The Outfit', 'The Worst Person in the World', 'Breaking', 'Honk for Jesus. Save Your S…', 'Mack & Rita', 'Studio 666', 'A Journal for Jordan', 'Crimes of the Future', 'Belfast', 'Gigi & Nate', 'The Good House', 'Parallel Mothers', 'Emily the Criminal', 'The Wolf and the Lion', 'Umma', 'Jeepers Creepers: Reborn', 'Drive My Car', 'Watcher', 'Mr. Malcolm’s List', 'Decision to Leave', 'Armageddon Time', '2022 Oscar Shorts', 'Radhe Shyam', 'The King’s Daughter', 'Infinite Storm', 'Jugjugg Jeeyo', 'The Duke', 'Running The Bases', 'Y Como Es El', 'The Kashmir Files', '2000 Mules', 'The Servant', 'The Godfather', 'Acharya', 'Medieval', 'Rogue One: A Star Wars Story', 'Dune', 'Fire of Love', 'Hallelujah: Leonard Cohen, …', 'Drishyam 2', 'The Contractor', 'After Ever Happy', 'The Beatles Get Back: The R…', 'Venom: Let There be Carnage', 'Twenty One Pilots: Cinema E…', 'Hansan: Rising Dragon', 'The Tiger Rising', 'Petite maman', 'Aftersun', 'The Phantom of the Open', 'Aline', 'Ante Sundaraniki', 'The Roundup', 'Official Competition', 'Cuando Sea Joven', 'Runway 34', 'Confess, Fletch', 'The Legend of Maula Jatt', 'Call Jane', 'God’s Country', 'Deep in the Heart: A Texas …', 'The Railway Children', 'Brian and Charles', 'Beast', 'Emergency Declaration', 'Facing Nolan', 'Superspreader', 'King Richard', 'Yashoda', 'Tyson’s Run', 'Alice', 'Selena', 'Inu-Oh', 'The Forgiven', 'Godzilla Against MechaGodzilla', 'Red Rocket', 'Mad God', 'Clean', 'Waterman', 'Meet Me in the Bathroom', 'The Deer King', 'Montana Story', 'Flee', 'A Love Song', 'Mothering Sunday', 'Kaathu Vaakula Rendu Kadhal', 'Gone in the Night', 'You Won’t Be Alone', 'Paul’s Promise', 'The Automat'
        ];
        const setAppInputTestAlert = FormSet.cbSetAlert(appInputTestBox, null, { color: 'blue' });
        const arr = enArr.concat(koArr);
        const ARRAY_LEN_LIMIT = 10;
        let appInput;
        const inputEvtHandler = (evt) => {
            // todo: Unknown if ccOS instance is destroyed: Need an interface to know that ccOS instance is destroyed?
            if (!ccOS.WebResource._instances[ccOS.AppInput.URI] || !appInput) {
                setAppInputTestAlert('AppInput instance undefined.', 'red');
                ccOS.AppInput.getInstance({ _debugOptions: { logLevel: ccOS.Logger.TRACE, output: globalLogger } })
                    .then(instance => {
                    appInput = instance;
                    inputEvtHandler(evt);
                });
                return;
            }
            const value = evt.target.value;
            const regex = new RegExp(value);
            const suggestions = !value ? [] : arr.filter(item => regex.test(item) || regex.test(item.toLowerCase()))
                .splice(0, ARRAY_LEN_LIMIT);
            appInput.setSuggestionsText(suggestions);
            setAppInputTestAlert("setSuggestionsText " + JSON.stringify(suggestions));
        };
        testInput.oninput = inputEvtHandler;
    }
    const getInstance = () => {
        var _a;
        setAlert('');
        (_a = ccOS.AppInput) === null || _a === void 0 ? void 0 : _a.getInstance({ _debugOptions: { logLevel: ccOS.Logger.TRACE, output: globalLogger } }).then(instance => {
            btnGetInstance.disabled = true;
            const properties = [{
                    name: 'suggestionsText',
                    type: 'text',
                    inputType: 'object',
                    initSetInput: true
                },
                {
                    name: 'userLoggedIn',
                    type: 'selection',
                    initSetInput: true,
                    inputType: 'boolean',
                    selection: [true, false]
                }
            ];
            new TestForm({
                instance, properties, parentElement: box,
                onDestroy: () => {
                    btnGetInstance.disabled = false;
                }
            });
        }).catch(e => {
            log('failed to get instance:', e);
            setAlert(e);
        });
    };
    btnGetInstance.onclick = getInstance;
    // getInstance();
    // ]] usage of ccOS 'appinput'
    return box;
}
function createTelephonyBox() {
    const box = createBox('telephony');
    const btnGetInstance = FormSet.createButton({ innerText: 'getInstance', className: 'm5' });
    box.appendChild(btnGetInstance);
    const setAlert = FormSet.cbSetAlert(box);
    // usage of ccOS 'telephony'  [[
    if (!ccOS.Telephony)
        setAlert('ccOS.Telephony undefined');
    const getInstance = () => {
        var _a;
        setAlert('');
        (_a = ccOS.Telephony) === null || _a === void 0 ? void 0 : _a.getInstance({ _debugOptions: { logLevel: ccOS.Logger.TRACE, output: globalLogger } }).then(instance => {
            btnGetInstance.disabled = true;
            const properties = [
                {
                    name: 'phoneNumber',
                    type: 'text',
                    hasSet: false,
                    selection: []
                },
                {
                    name: 'iccidNumber',
                    type: 'text',
                    hasSet: false,
                    selection: []
                }
            ];
            new TestForm({
                instance, properties, parentElement: box,
                onDestroy: () => {
                    btnGetInstance.disabled = false;
                }
            });
        }).catch(e => {
            log('failed to get instance:', e);
            setAlert(e);
        });
    };
    btnGetInstance.onclick = getInstance;
    // getInstance();
    // ]] usage of ccOS 'telephony'
    return box;
}
function createUserprofileBox() {
    const box = createBox('userprofile');
    const btnGetInstance = FormSet.createButton({ innerText: 'getInstance', className: 'm5' });
    box.appendChild(btnGetInstance);
    const setAlert = FormSet.cbSetAlert(box);
    // usage of ccOS 'userprofile'  [[
    if (!ccOS.Userprofile)
        setAlert('ccOS.Userprofile undefined');
    const getInstance = () => {
        var _a;
        setAlert('');
        (_a = ccOS.Userprofile) === null || _a === void 0 ? void 0 : _a.getInstance({ _debugOptions: { logLevel: ccOS.Logger.TRACE, output: globalLogger } }).then(instance => {
            btnGetInstance.disabled = true;
            const properties = [{
                    name: 'name',
                    type: 'text',
                    hasSet: false,
                    selection: []
                }];
            new TestForm({
                instance, properties, parentElement: box,
                onDestroy: () => {
                    btnGetInstance.disabled = false;
                }
            });
        }).catch(e => {
            log('failed to get instance:', e);
            setAlert(e);
        });
    };
    btnGetInstance.onclick = getInstance;
    // getInstance();
    // ]] usage of ccOS 'vehicle'
    return box;
}
function createVehicleBox() {
    const box = createBox('vehicle');
    const btnGetInstance = FormSet.createButton({ innerText: 'getInstance', className: 'm5' });
    box.appendChild(btnGetInstance);
    const setAlert = FormSet.cbSetAlert(box);
    // usage of ccOS 'vehicle' [[
    if (!ccOS.Vehicle)
        setAlert('ccOS.Vehicle undefined');
    const getInstance = () => {
        var _a;
        setAlert('');
        (_a = ccOS.Vehicle) === null || _a === void 0 ? void 0 : _a.getInstance({ _debugOptions: { logLevel: ccOS.Logger.TRACE, output: globalLogger } }).then(vehicleInstance => {
            btnGetInstance.disabled = true;
            const properties = [{
                    name: 'regulationState',
                    type: 'text',
                    hasSet: false,
                    selection: []
                },
                {
                    name: 'vehicleId',
                    type: 'text',
                    hasSet: false,
                    selection: []
                }];
            new TestForm({ instance: vehicleInstance, properties, parentElement: box,
                onDestroy: () => {
                    btnGetInstance.disabled = false;
                } });
            // log('vehicle dump:', vehicleInstance.dump());
            // setInterval( () => {
            //   if ((vehicleInstance as ccOS.Vehicle).getRegulationState() === ccOS.Vehicle.VALUE_REGULATION_STATE_ACTIVE)
            //     /* only for DEV, illegal usage */
            //     vehicleInstance._wrappedData['regulationState'] = ccOS.Vehicle.VALUE_REGULATION_STATE_INACTIVE;
            //   else
            //     vehicleInstance._wrappedData['regulationState'] = ccOS.Vehicle.VALUE_REGULATION_STATE_ACTIVE;
            // }, 2000);
        }).catch(e => {
            log('failed to get instance:', e);
            setAlert(e);
        });
    };
    // ]] usage of ccOS 'vehicle'
    btnGetInstance.onclick = getInstance;
    // getInstance();
    return box;
}
function createPopupsBox() {
    var _a, _b, _c, _d, _e;
    const box = createBox('popups');
    const typeBox = FormSet.createDiv({ className: 'solid m10 p5 getInstance flexBox' });
    const requiredBox = FormSet.createDiv({ className: 'solid m5 p5 required flexBox' });
    const optionBox = FormSet.createDiv({ className: 'm5 p5 option flexBox' });
    const optionsOfType = [((_a = ccOS === null || ccOS === void 0 ? void 0 : ccOS.Popup) === null || _a === void 0 ? void 0 : _a.VALUE_TYPE_OSD) || 'osd', ((_b = ccOS.Popup) === null || _b === void 0 ? void 0 : _b.VALUE_TYPE_TOAST) || 'toast', ((_c = ccOS.Popup) === null || _c === void 0 ? void 0 : _c.VALUE_TYPE_CONFIRM) || 'confirm'];
    const radioType = FormSet.createRadio(optionsOfType, 'type', { optClass: 'initPopupType', coverClass: 'type' });
    const inputText = FormSet.createText('text', { value: 'new text', coverClass: 'text', textClass: 'm5 initPopupText' });
    const optionsOfStatus = [((_d = ccOS.Popup) === null || _d === void 0 ? void 0 : _d.VALUE_STATUS_SHOWN) || 'shown', ((_e = ccOS.Popup) === null || _e === void 0 ? void 0 : _e.VALUE_STATUS_HIDDEN) || 'hidden'];
    const radioStatus = FormSet.createRadio(optionsOfStatus, 'status', { checkedIndex: -1, optClass: 'initPopupStatus', coverClass: 'status' });
    const inputTitle = FormSet.createText('title', { value: '', coverClass: 'title', textClass: 'm5' });
    const inputConfirmTextOk = FormSet.createText('confirmTextOk', { value: '', coverClass: 'confirmTextOk', textClass: 'm5' });
    const inputConfirmTextCancel = FormSet.createText('confirmTextCancel', { value: '', coverClass: 'confirmTextCancel', textClass: 'm5' });
    const btnGetInstance = FormSet.createButton({ innerText: 'getInstance', className: 'm5' });
    requiredBox.appendChild(radioType);
    requiredBox.appendChild(inputText);
    optionBox.appendChild(radioStatus);
    optionBox.appendChild(inputTitle);
    optionBox.appendChild(inputConfirmTextOk);
    optionBox.appendChild(inputConfirmTextCancel);
    typeBox.appendChild(requiredBox);
    typeBox.appendChild(optionBox);
    typeBox.appendChild(btnGetInstance);
    box.appendChild(typeBox);
    const setAlert = FormSet.cbSetAlert(typeBox);
    if (!ccOS.Popup)
        setAlert('ccOS.Popup undefined');
    btnGetInstance.onclick = () => {
        var _a, _b, _c;
        setAlert('');
        const initData = {};
        // required
        const text = (_a = requiredBox.querySelector('input[type="text"]')) === null || _a === void 0 ? void 0 : _a.value;
        const typeValue = (_b = requiredBox.querySelector('input[type="radio"]:checked')) === null || _b === void 0 ? void 0 : _b.value;
        // etc
        const statusCheckedRadio = optionBox.querySelector('input[type="radio"]:checked');
        const txtTitle = optionBox.querySelector('.title input[type="text"]');
        const txtConfirmTextOk = optionBox.querySelector('.confirmTextOk input[type="text"]');
        const txtConfirmTextCancel = optionBox.querySelector('.confirmTextCancel input[type="text"]');
        const status = statusCheckedRadio === null || statusCheckedRadio === void 0 ? void 0 : statusCheckedRadio.value;
        const title = txtTitle === null || txtTitle === void 0 ? void 0 : txtTitle.value;
        const confirmTextOk = txtConfirmTextOk === null || txtConfirmTextOk === void 0 ? void 0 : txtConfirmTextOk.value;
        const confirmTextCancel = txtConfirmTextCancel === null || txtConfirmTextCancel === void 0 ? void 0 : txtConfirmTextCancel.value;
        if (status)
            initData['status'] = status;
        if (title)
            initData['title'] = title;
        if (confirmTextOk)
            initData['confirmTextOk'] = confirmTextOk;
        if (confirmTextCancel)
            initData['confirmTextCancel'] = confirmTextCancel;
        if (statusCheckedRadio)
            statusCheckedRadio.checked = false;
        [txtTitle, txtConfirmTextOk, txtConfirmTextCancel].forEach((input) => input.value = '');
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (_c = ccOS.Popup) === null || _c === void 0 ? void 0 : _c.getInstance(Object.assign(Object.assign({ text, type: typeValue }, initData), { _debugOptions: { logLevel: ccOS.Logger.TRACE, output: globalLogger } })).then((popup) => {
            log('popup instance is created', popup);
            const properties = [
                {
                    name: 'type', type: 'selection',
                    selection: [ccOS.Popup.VALUE_TYPE_OSD, ccOS.Popup.VALUE_TYPE_TOAST, ccOS.Popup.VALUE_TYPE_CONFIRM],
                    initSetInput: true
                },
                { name: 'title', type: 'text' },
                { name: 'text', type: 'text' },
                {
                    name: 'status', type: 'custom',
                    createCustomSetBtn: (instance) => {
                        const divBox = FormSet.createDiv();
                        const btnShow = FormSet.createButton({ innerText: 'show' });
                        const btnHide = FormSet.createButton({ innerText: 'hide' });
                        divBox.appendChild(btnShow);
                        divBox.appendChild(btnHide);
                        btnShow.onclick = () => { instance && instance.show(); };
                        btnHide.onclick = () => { instance && instance.hide(); };
                        return divBox;
                    }
                },
                { name: 'result', type: 'text', hasSet: false },
                { name: 'confirmTextOk', type: 'text' },
                { name: 'confirmTextCancel', type: 'text' }
            ];
            new TestForm({ instance: popup, properties, parentElement: box });
        }).catch(e => {
            console.warn(e);
            setAlert(e);
        });
    };
    return box;
}
function createSetupHMIBox() {
    const box = createBox('setupHMI');
    const btnGetInstance = FormSet.createButton({ innerText: 'getInstance', className: 'm5' });
    box.appendChild(btnGetInstance);
    const setAlert = FormSet.cbSetAlert(box);
    // usage of ccOS 'SetupHMI'  [[
    if (!ccOS.SetupHMI) {
        setAlert('ccOS.SetupHMI undefined');
    }
    const getInstance = () => {
        var _a;
        setAlert('');
        (_a = ccOS.SetupHMI) === null || _a === void 0 ? void 0 : _a.getInstance({ _debugOptions: { logLevel: ccOS.Logger.TRACE, output: globalLogger } }).then(instance => {
            instance.applyDebugOptions({ logLevel: ccOS.Logger.TRACE, output: globalLogger });
            btnGetInstance.disabled = true;
            const methods = [
                { name: 'launchDeviceConnectionScene' }
            ];
            const properties = [
                { name: 'state', type: 'text', hasSet: false, hasGet: false },
            ];
            new TestForm({
                instance, properties, methods, parentElement: box,
                onDestroy: () => {
                    btnGetInstance.disabled = false;
                }
            });
        }).catch(e => {
            log('failed to get instance:', e);
            setAlert(e);
        });
    };
    btnGetInstance.onclick = getInstance;
    // getInstance();
    // ]] usage of ccOS 'SetupHMI'
    return box;
}
function createHomeHMIBox() {
    const box = createBox('homeHMI');
    const btnGetInstance = FormSet.createButton({ innerText: 'getInstance', className: 'm5' });
    box.appendChild(btnGetInstance);
    const setAlert = FormSet.cbSetAlert(box);
    // usage of ccOS 'HomeHMI'  [[
    if (!ccOS.SetupHMI) {
        setAlert('ccOS.HomeHMI undefined');
    }
    const getInstance = () => {
        var _a;
        setAlert('');
        (_a = ccOS.HomeHMI) === null || _a === void 0 ? void 0 : _a.getInstance({ _debugOptions: { logLevel: ccOS.Logger.TRACE, output: globalLogger } }).then(instance => {
            instance.applyDebugOptions({ logLevel: ccOS.Logger.TRACE, output: globalLogger });
            btnGetInstance.disabled = true;
            const methods = [
                { name: 'launchMainScene' }
            ];
            const properties = [
                { name: 'state', type: 'text', hasSet: false, hasGet: false },
            ];
            new TestForm({
                instance, properties, methods, parentElement: box,
                onDestroy: () => {
                    btnGetInstance.disabled = false;
                }
            });
        }).catch(e => {
            log('failed to get instance:', e);
            setAlert(e);
        });
    };
    btnGetInstance.onclick = getInstance;
    // getInstance();
    // ]] usage of ccOS 'HomeHMI'
    return box;
}
function createNavigationBox() {
    const box = createBox('navigation');
    const btnGetInstance = FormSet.createButton({ innerText: 'getInstance', className: 'm5' });
    box.appendChild(btnGetInstance);
    const setAlert = FormSet.cbSetAlert(box);
    // usage of ccOS 'Navigation'  [[
    if (!ccOS.Navigation) {
        setAlert('ccOS.Navigation undefined');
    }
    const getInstance = () => {
        var _a;
        setAlert('');
        (_a = ccOS.Navigation) === null || _a === void 0 ? void 0 : _a.getInstance({ _debugOptions: { logLevel: ccOS.Logger.TRACE, output: globalLogger } }).then(instance => {
            instance.applyDebugOptions({ logLevel: ccOS.Logger.TRACE, output: globalLogger });
            btnGetInstance.disabled = true;
            const methods = [
                { name: 'launchMainScene' },
                { name: 'launchPrevDestinationScene' },
                {
                    name: 'launchSearchResultScene',
                    arguments: [
                        { name: 'keyword', type: 'text', option: { placeholder: 'keyword' } }
                    ]
                }
            ];
            const properties = [
                { name: 'state', type: 'text', hasSet: false, hasGet: false },
            ];
            new TestForm({
                instance, properties, methods, parentElement: box,
                onDestroy: () => {
                    btnGetInstance.disabled = false;
                }
            });
        }).catch(e => {
            log('failed to get instance:', e);
            setAlert(e);
        });
    };
    btnGetInstance.onclick = getInstance;
    // getInstance();
    // ]] usage of ccOS 'Navigation'
    return box;
}
function createBluetoothBox() {
    const box = createBox('bluetooth');
    const bluetoothTestBox = FormSet.createDiv({ id: 'bluetoothTestBox', className: 'm5' });
    const btnGetInstance = FormSet.createButton({ innerText: 'getInstance', className: 'm5' });
    box.appendChild(btnGetInstance);
    box.appendChild(bluetoothTestBox);
    const setAlert = FormSet.cbSetAlert(box);
    // usage of ccOS 'Bluetooth'  [[
    if (!ccOS.Bluetooth) {
        setAlert('ccOS.Bluetooth undefined');
    }
    const getInstance = () => {
        var _a;
        setAlert('');
        (_a = ccOS.Bluetooth) === null || _a === void 0 ? void 0 : _a.getInstance({ _debugOptions: { logLevel: ccOS.Logger.TRACE, output: globalLogger } }).then(instance => {
            btnGetInstance.disabled = true;
            const properties = [{
                    name: 'bleDevices',
                    type: 'text',
                    inputType: 'object',
                    hasSet: false
                },
                {
                    name: 'bleScanStatus', type: 'custom',
                    hasGet: false,
                    createCustomSetBtn: (instance) => {
                        const divBox = FormSet.createDiv();
                        const btnScan = FormSet.createButton({ innerText: 'bleScan' });
                        divBox.appendChild(btnScan);
                        btnScan.onclick = () => { instance && instance.bleScan(); };
                        return divBox;
                    }
                }
            ];
            new TestForm({
                instance, properties, parentElement: box,
                onDestroy: () => {
                    btnGetInstance.disabled = false;
                }
            });
        }).catch(e => {
            log('failed to get instance:', e);
            setAlert(e);
        });
    };
    btnGetInstance.onclick = getInstance;
    // getInstance();
    // ]] usage of ccOS 'Bluetooth'
    return box;
}
function createVoiceRecognizerBox() {
    const box = createBox('voiceRecognizer');
    const voiceRecognizerTestBox = FormSet.createDiv({ id: 'voiceRecognizerTestBox', className: 'm5' });
    const btnGetInstance = FormSet.createButton({ innerText: 'getInstance', className: 'm5' });
    box.appendChild(btnGetInstance);
    box.appendChild(voiceRecognizerTestBox);
    const setAlert = FormSet.cbSetAlert(box);
    // usage of ccOS 'voiceRecognizer'  [[
    if (!ccOS.VoiceRecognizer) {
        setAlert('ccOS.VoiceRecognizer undefined');
    }
    const getInstance = () => {
        var _a;
        setAlert('');
        (_a = ccOS.VoiceRecognizer) === null || _a === void 0 ? void 0 : _a.getInstance({ _debugOptions: { logLevel: ccOS.Logger.TRACE, output: globalLogger } }).then(instance => {
            btnGetInstance.disabled = true;
            const properties = [
                { name: 'state', type: 'text', hasSet: false, hasGet: false },
                {
                    name: 'result',
                    type: 'json', hasSet: false, hasGet: false
                },
                {
                    name: 'partialResult',
                    type: 'json', hasSet: false, hasGet: false
                },
                {
                    name: 'action', type: 'custom',
                    createCustomSetBtn: (instance) => {
                        const divBox = FormSet.createDiv();
                        const inputText = FormSet.createElement('input', Object.assign({
                            type: 'text', className: 'params', value: '{"config":{"audioZone":"front"},"promptArg":{"promptId":"kindly","args":["집","회사"],"guidanceType":"prompt","promptString":"옛 생각에 카페 문을 열고 지난 추억을 기억하려 했지 부드러운 음악소리 마저 내 마음을 아프게 해 비마저 내린 그 날을 생각하네 내 욕심과 자만에 슬픈 너의 표정 텅 빈 카페에 홀로 기대어 나도 모르는 눈물을 흘리네 난 두 눈을 꼭 감고 있지만 너의 모습이 있을 뿐 이 밤이 깊어가지만 지금 전화를 걸어 너를 볼 수 있을까 두려워 넌 지금도 울고 있을 거야 이슬비처럼 여린 너의 마음 그대 제발 슬퍼하지 말아요 ","url":"","contentType":"vr"},"addArg":{"G2PDeviceId":"0001818-0000-1000-8000-00805f9b34fb","DetectedPosition":"driver"}}'
                        }));
                        const btnInit = FormSet.createButton({ innerText: 'init' });
                        const btnStart = FormSet.createButton({ innerText: 'start' });
                        const btnPause = FormSet.createButton({ innerText: 'pause' });
                        const btnResume = FormSet.createButton({ innerText: 'resume' });
                        const btnStop = FormSet.createButton({ innerText: 'stop' });
                        divBox.appendChild(inputText);
                        divBox.appendChild(btnInit);
                        divBox.appendChild(btnStart);
                        divBox.appendChild(btnPause);
                        divBox.appendChild(btnResume);
                        divBox.appendChild(btnStop);
                        btnInit.onclick = (evt) => {
                            const params = evt.target.parentElement.querySelector('.params');
                            const paramsVal = JSON.parse(params.value);
                            instance && instance.initVr(paramsVal.config);
                        };
                        btnStart.onclick = (evt) => {
                            const params = evt.target.parentElement.querySelector('.params');
                            const paramsVal = JSON.parse(params.value);
                            instance && instance.start(paramsVal.promptArg, paramsVal.addArg || {});
                        };
                        btnPause.onclick = () => { instance && instance.pause(); };
                        btnResume.onclick = () => { instance && instance.resume(); };
                        btnStop.onclick = () => { instance && instance.stop(); };
                        return divBox;
                    }, hasGet: false
                },
            ];
            new TestForm({
                instance, properties, parentElement: box,
                onDestroy: () => {
                    btnGetInstance.disabled = false;
                }
            });
        }).catch(e => {
            log('failed to get instance:', e);
            setAlert(e);
        });
    };
    btnGetInstance.onclick = getInstance;
    // getInstance();
    // ]] usage of ccOS 'voiceRecognizer'
    return box;
}
function createTextToSpeechBox() {
    const box = createBox('textToSpeech');
    const voiceRecognizerTestBox = FormSet.createDiv({ id: 'textToSpeechTestBox', className: 'm5' });
    const btnGetInstance = FormSet.createButton({ innerText: 'getInstance', className: 'm5' });
    box.appendChild(btnGetInstance);
    box.appendChild(voiceRecognizerTestBox);
    const setAlert = FormSet.cbSetAlert(box);
    // usage of ccOS 'textToSpeech'  [[
    if (!ccOS.TextToSpeech) {
        setAlert('ccOS.TextToSpeech undefined');
    }
    const getInstance = () => {
        var _a;
        setAlert('');
        (_a = ccOS.TextToSpeech) === null || _a === void 0 ? void 0 : _a.getInstance({ _debugOptions: { logLevel: ccOS.Logger.TRACE, output: globalLogger } }).then(instance => {
            btnGetInstance.disabled = true;
            const properties = [
                { name: 'state', type: 'text', hasSet: false, hasGet: false },
                {
                    name: 'action', type: 'custom',
                    createCustomSetBtn: (instance) => {
                        const divBox = FormSet.createDiv();
                        const inputText = FormSet.createElement('input', Object.assign({
                            type: 'text', className: 'params', value: '{"params":{"promptId":"kindly","args":["집","회사"],"beepType":"start","promptString":"옛 생각에 카페 문을 열고 지난 추억을 기억하려 했지 부드러운 음악소리 마저 내 마음을 아프게 해 비마저 내린 그 날을 생각하네 내 욕심과 자만에 슬픈 너의 표정 텅 빈 카페에 홀로 기대어 나도 모르는 눈물을 흘리네 난 두 눈을 꼭 감고 있지만 너의 모습이 있을 뿐 이 밤이 깊어가지만 지금 전화를 걸어 너를 볼 수 있을까 두려워 넌 지금도 울고 있을 거야 이슬비처럼 여린 너의 마음 그대 제발 슬퍼하지 말아요 ","url":"","contentType":"vr"}}'
                        }));
                        const btnPlayEarcon = FormSet.createButton({ innerText: 'playEarcon' });
                        const btnSpeak = FormSet.createButton({ innerText: 'speak' });
                        const btnPause = FormSet.createButton({ innerText: 'pause' });
                        const btnResume = FormSet.createButton({ innerText: 'resume' });
                        const btnStop = FormSet.createButton({ innerText: 'stop' });
                        divBox.appendChild(inputText);
                        divBox.appendChild(btnPlayEarcon);
                        divBox.appendChild(btnSpeak);
                        divBox.appendChild(btnPause);
                        divBox.appendChild(btnResume);
                        divBox.appendChild(btnStop);
                        btnPlayEarcon.onclick = (evt) => {
                            const params = evt.target.parentElement.querySelector('.params');
                            const paramsVal = JSON.parse(params.value);
                            instance && instance.playEarcon(paramsVal.params);
                        };
                        btnSpeak.onclick = (evt) => {
                            const params = evt.target.parentElement.querySelector('.params');
                            const paramsVal = JSON.parse(params.value);
                            instance && instance.speak(paramsVal.params);
                        };
                        btnPause.onclick = () => { instance && instance.pause(); };
                        btnResume.onclick = () => { instance && instance.resume(); };
                        btnStop.onclick = () => { instance && instance.stop(); };
                        return divBox;
                    }, hasGet: false
                },
            ];
            new TestForm({
                instance, properties, parentElement: box,
                onDestroy: () => {
                    btnGetInstance.disabled = false;
                }
            });
        }).catch(e => {
            log('failed to get instance:', e);
            setAlert(e);
        });
    };
    btnGetInstance.onclick = getInstance;
    // getInstance();
    // ]] usage of ccOS 'textToSpeech'
    return box;
}
// function updateProp(prop: string, value: string, box: HTMLElement) {
//   const stateValue = box.querySelector(`#${prop}value`);
//   (stateValue as HTMLElement).innerText = typeof value === "object" ? JSON.stringify(value, null, 2) : value;
// }
// function createPropertyBox(id: string, propVal = '') {
//   const box = FormSet.createDiv( {id});
//   const name = FormSet.createElement('span', {innerText: id + ':'});
//   const value = FormSet.createElement('span', {id: id + 'value', innerText: propVal});
//   box.appendChild(name);
//   box.appendChild(value);
//   return box;
// }
function createBox(id) {
    const box = FormSet.createDiv({ id, className: 'solid m10 p10' });
    box.innerHTML = '<b>' + id + '</b>';
    return box;
}
class FormSet {
}
FormSet.toUpperCaseOfFirst = str => str.replace(/./, v => v.toUpperCase());
/**
 *
 * @param options {target, setInstance, getInitData, setAlert} {target{ccOS.WebResource}, setTarget{function}, getInitData{function}, setAlert{function}}
 * @returns HTMLButtonElement
 */
FormSet.createGetInstanceBtn = (options) => {
    const { target, setInstance, getInitData, setAlert } = Object.assign({
        target: null, setInstance: undefined, getInitData: () => ({}), setAlert: undefined
    }, options);
    const btnGetInstance = FormSet.createButton({ innerHTML: 'getInstance' });
    btnGetInstance.onclick = () => {
        const initData = (getInitData && getInitData()) || {};
        target === null || target === void 0 ? void 0 : target['getInstance'](initData).then(setInstance).catch(e => {
            console.warn(e);
            setAlert && setAlert(e);
        });
    };
    return btnGetInstance;
};
FormSet.createElement = (name, options = {}) => Object.assign(document.createElement(name), options);
FormSet.createDiv = (options = {}) => Object.assign(document.createElement("div"), options);
FormSet.createButton = (options = {}) => Object.assign(document.createElement("button"), options);
/**
 * Returns span.alert html tag containing str as a string.
 * like `<span class="alert">${str.toString()}</span>`
 * @param str {string|Error} alert phrases
 * @param color {string|undefined} alert text color(default:'red')
 */
FormSet.alertSpan = (str, color = 'red') => `<span class="alert" style="color: ${color}">${str.toString()}</span>`;
/**
 * Returns callback to set alert string and color in label
 * @param box{HTMLElement|null} parent element of label
 * @param lbl{HTMLElement|null|undefined} target to apply alertSpan
 * @param options{Object|undefined} color{string}: alert text color(default:'red')
 * @returns function (str:string, color:string|undefined) : void
 * @example
 * const cb = FormSet.cbSetAlert(box, label);
 * cb('test', 'blue');
 * FormSet.cbSetAlert(box);
 * const cb2 = * FormSet.cbSetAlert(box, null, {color:'blue'});
 * cb2('notification!!', 'red');
 * FormSet.cbSetAlert(null, label);
 */
FormSet.cbSetAlert = (box = null, lbl = null, options = {}) => {
    const { color } = Object.assign({ color: 'red' }, options);
    const lblAlert = lbl || FormSet.createElement('label');
    if (box)
        box.appendChild(lblAlert);
    return (str, pColor = color) => lblAlert && (lblAlert.innerHTML = FormSet.alertSpan(str, pColor));
};
FormSet.InputType = { object: 'object', string: 'string', number: 'number', boolean: 'boolean' };
FormSet.nameOfSetFunc = name => `set${name.replace(/./, v => v.toUpperCase())}`;
/**
 * Returns a div HTMLElement that has an HTMLInputElement whose type is text as a child.
 * @param selection {string[]} string array for selection
 * @param name {string} element representative name
 * @param options {{checkedIndex, coverClass, optClass}} options for radio element
 * (checkedIndex: checked index, coverClass: className of cover element, optClass: className of options element)
 */
FormSet.createRadio = function (selection, name, options = {}) {
    const { checkedIndex, optClass, coverClass } = Object.assign({ checkedIndex: 0, optClass: '', coverClass: '' }, options);
    let rndOpt;
    const rndName = parseInt(Math.random() * 1000 + "");
    const radioOptId = (option) => `radio_${rndOpt}_${name}_${option}`;
    const radioName = `radio_${rndName}_${name}`;
    const divCtx = FormSet.createDiv({ name, className: coverClass });
    const createRadioOption = (option, props = {}) => FormSet.createElement('input', Object.assign({ type: 'radio', name: radioName, id: radioOptId(option), value: option, innerText: option, className: optClass }, props));
    const createOptionLabel = option => {
        const lbl = FormSet.createElement('label', { for: 'radio' + option + name, innerText: option, className: 'p5' });
        lbl.setAttribute('for', radioOptId(option));
        return lbl;
    };
    let checked = 0;
    selection.forEach(opt => {
        rndOpt = parseInt(Math.random() * 1000 + "");
        const radio = createRadioOption(opt, { checked: checkedIndex === checked++ });
        const lbl = createOptionLabel(opt);
        divCtx.appendChild(radio);
        divCtx.appendChild(lbl);
    });
    return divCtx;
};
/**
 * Returns a div HTMLElement that has an HTMLInputElement whose type is text as a child.
 * @param propName
 * @param options {placeholder, value, coverClass, textClass}
 */
FormSet.createText = function (propName, options = {}) {
    const { placeholder, value, coverClass, textClass, inputType } = Object.assign({ placeholder: propName, value: '', textClass: '', coverClass: '', inputType: 'text' }, options);
    const divCtx = FormSet.createDiv({ className: coverClass });
    //const inputText = FormSet.createElement('input', {type: 'text', placeholder, value, className: textClass, ...options});
    const inputText = FormSet.createElement('input', Object.assign({ type: (inputType !== 'number' ? 'text' : 'number'), placeholder, value, className: textClass }, options));
    divCtx.appendChild(inputText);
    return divCtx;
};
/**
 * Returns button htmlElement to apply setXxx of instance
 * @param instance {ccOS.WebResource} instance call to setXxxx
 * @param propName {string} property name
 * @param options {{form, inputType}}
 * form {string} - form type like text, radio
 * inputType {string} - object|string property type
 * @example
 * const setBtn = FormSet.createSetBtn(vsm, 'value', {form:'text', inputType: 'object'});
 */
FormSet.createSetBtn = function (instance, propName, options = {}) {
    const funcName = FormSet.nameOfSetFunc(propName);
    const btnSet = FormSet.createButton({ innerText: funcName, className: 'm2' });
    const { inputType, form } = Object.assign({ form: 'text', inputType: FormSet.InputType.string }, options);
    const createClickHandler = (instance, name, form) => evt => {
        const parent = evt.target.parentElement;
        let value;
        const displayErr = e => {
            console.warn(e.toString());
            btnSet.innerHTML = `${funcName}<span class="alert">${e.toString()}</span>`;
        };
        if (form === 'radio') {
            const checkedOpt = parent.querySelector(`input[type="radio"]:checked`);
            value = checkedOpt.value;
            if (inputType === 'boolean') {
                value = (value === 'true');
            }
            else if (inputType === 'number') {
                try {
                    value = parseFloat(value);
                }
                catch (e) {
                    console.warn(e);
                }
            }
        }
        if (form === 'json') {
            const txtEle = parent.querySelectorAll(`input`);
            value = {};
            txtEle.forEach(item => {
                if (item.type === 'number') {
                    try {
                        value[item.placeholder] = parseFloat(item.value);
                    }
                    catch (e) {
                        console.warn(e);
                    }
                }
                else {
                    value[item.placeholder] = item.value;
                }
            });
        }
        if (form === 'text') {
            const txtEle = parent.querySelector(`input`);
            value = txtEle.value;
            try {
                if (inputType === 'object')
                    value = JSON.parse(value);
                else if (txtEle.type === 'number')
                    value = parseFloat(value);
            }
            catch (e) {
                return displayErr(e);
            }
        }
        try {
            if (value !== undefined)
                instance[funcName](value);
        }
        catch (e) {
            return displayErr(e);
        }
        btnSet.innerHTML = `${funcName}`;
    };
    btnSet.onclick = createClickHandler(instance, propName, form);
    return btnSet;
};
var testType;
(function (testType) {
    testType["text"] = "text";
    testType["custom"] = "custom";
    testType["selection"] = "selection";
    testType["json"] = "json";
})(testType || (testType = {}));
class TestForm {
    /**
     *
     * @param instance
     * @param properties
     * @param methods
     * @param parentElement
     * @param options
     * @param onDestroy
     */
    constructor({ instance, properties, methods = [], parentElement, options = {}, onDestroy = undefined }) {
        this._beautify = false;
        this._instance = instance;
        this._options = options;
        this._parentElement = parentElement;
        this._properties = properties;
        this._methods = methods;
        this._handleDestroy = onDestroy;
        this.createInstanceForm();
    }
    setProperty(propertyName, value) {
        var _a, _b;
        const fcName = `set${FormSet.toUpperCaseOfFirst(propertyName)}`;
        return (_b = (_a = this._instance) === null || _a === void 0 ? void 0 : _a[fcName]) === null || _b === void 0 ? void 0 : _b.call(_a, value);
    }
    getProperty(propertyName) {
        var _a, _b;
        const fcName = `get${FormSet.toUpperCaseOfFirst(propertyName)}`;
        return (_b = (_a = this._instance) === null || _a === void 0 ? void 0 : _a[fcName]) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
    onClickBtnDestroy() {
        this._instance.destroy();
        this._handleDestroy && this._handleDestroy();
        this._parentElement.removeChild(this._instanceForm);
    }
    getBeautifyState() {
        return this._beautify ? 'uglify' : 'beautify';
    }
    onClickBtnBeautify(e) {
        this._beautify = !this._beautify;
        e.target.innerText = this.getBeautifyState();
    }
    onClickBtnClear() {
        this._txtAreaProp.value = '';
        this._txtAreaProp.scrollTop = this._txtAreaProp.scrollHeight;
    }
    onClickBtnGetProp(name) {
        this.addText({ [name]: this.getProperty(name) });
    }
    addText(data) {
        const txtAreaProp = this._txtAreaProp;
        const timestamp = new Date().toJSON();
        const str = JSON.stringify(Object.assign({ timestamp }, data), null, this._beautify ? 2 : 0);
        txtAreaProp.value += '\n' + str;
        txtAreaProp.scrollTop = txtAreaProp.scrollHeight;
    }
    createInstanceForm() {
        var _a, _b;
        const instanceForm = FormSet.createDiv({ className: 'm5 p2 solid instanceForm' });
        const headForm = FormSet.createDiv({ className: 'm5 head' });
        const btnDestroy = FormSet.createButton({ innerText: 'destroy' });
        const btnBeautify = FormSet.createButton({ innerText: this.getBeautifyState(), className: 'floatRight' });
        const btnClear = FormSet.createButton({ innerText: 'clear', className: 'floatRight' });
        const divTextareaForm = FormSet.createDiv({ className: 'flexBox wP100' });
        const txtAreaProp = FormSet.createElement('textarea', { className: 'm5 flex1', readOnly: true });
        this._instanceForm = instanceForm;
        this._txtAreaProp = txtAreaProp;
        const defaultPropertyOption = {
            name: '', type: '', selection: [], createCustomSetBtn: null, initSetInput: false, inputType: 'text',
            hasGet: true, hasSet: true, hasChangeEvent: true
        };
        const defaultProperties = [{ name: 'id' }, { name: 'uri' }];
        defaultProperties.forEach(info => {
            const { name } = Object.assign(Object.assign({}, defaultPropertyOption), info);
            const spanProp = FormSet.createElement('span', {
                innerHTML: `${name}: ${this.getProperty(name)}`,
                className: 'fontBolder mr5 p5'
            });
            if ('id' === name)
                instanceForm.setAttribute('data-id', this.getProperty(name));
            headForm.appendChild(spanProp);
        });
        headForm.appendChild(btnDestroy);
        headForm.appendChild(btnClear);
        headForm.appendChild(btnBeautify);
        divTextareaForm.appendChild(txtAreaProp);
        instanceForm.appendChild(headForm);
        instanceForm.appendChild(divTextareaForm);
        btnClear.onclick = this.onClickBtnClear.bind(this);
        btnBeautify.onclick = this.onClickBtnBeautify.bind(this);
        btnDestroy.onclick = this.onClickBtnDestroy.bind(this);
        this._parentElement.appendChild(instanceForm);
        defaultProperties.forEach(info => {
            const { name } = Object.assign(Object.assign({}, defaultPropertyOption), info);
            const btnGetProp = FormSet.createButton({ innerText: `get${FormSet.toUpperCaseOfFirst(name)}` });
            headForm.appendChild(btnGetProp);
            btnGetProp.onclick = () => this.onClickBtnGetProp(name);
        });
        (_a = this._properties) === null || _a === void 0 ? void 0 : _a.forEach(info => {
            let isAddedEventHandler = false;
            const { name, type, selection, createCustomSetBtn, initSetInput, inputType, hasSet, hasGet, hasChangeEvent } = Object.assign(Object.assign({}, defaultPropertyOption), info);
            const eventName = `${name.toLowerCase()}change`;
            const getEvtName = (isAdd = true) => `<span>${isAdd ? 'addEventListener' : 'removeEventListener'}:"${eventName}"</span>`;
            const eventHandler = (evt) => this.addText({ method: 'event', [name]: evt.detail[name] });
            const divProp = FormSet.createDiv({
                innerHTML: `<span class="fontBolder mr5">${name}</span>`,
                className: 'p5 prop'
            });
            const divBtnBox = FormSet.createDiv({ className: 'flexBox p2' });
            const btnGetProp = FormSet.createButton({ innerText: `get${FormSet.toUpperCaseOfFirst(name)}` });
            const btnToggleChangeEvent = FormSet.createButton({ innerHTML: getEvtName() });
            divProp.appendChild(divBtnBox);
            if (hasGet)
                divBtnBox.appendChild(btnGetProp);
            if (hasSet) {
                let inputEle;
                if (testType.custom && createCustomSetBtn) {
                    inputEle = createCustomSetBtn(this._instance);
                }
                else {
                    let btnSetProp;
                    switch (type) {
                        case testType.text: {
                            let value = this.getProperty(name);
                            const inputType = typeof value;
                            inputEle = FormSet.createText(name, { inputType });
                            inputEle.classList.add('setPropBox');
                            btnSetProp = FormSet.createSetBtn(this._instance, name, { inputType, form: 'text' });
                            if (initSetInput) {
                                if (inputType === FormSet.InputType.object) {
                                    try {
                                        value = JSON.stringify(value);
                                    }
                                    catch (e) {
                                        console.error(e);
                                    }
                                }
                                inputEle.firstChild.value = value;
                            }
                            break;
                        }
                        case testType.json: {
                            const buildInputsForJson = (parentBox, value) => {
                                for (const newName in value) {
                                    let newItem;
                                    if (typeof value[newName] !== 'object') {
                                        newItem = FormSet.createElement('div', {
                                            innerHTML: `${newName}:`,
                                            className: 'fontBolder mr5 p5'
                                        });
                                        // TODO: support radio for boolean
                                        const inputType = typeof value[newName];
                                        console.log('checking:', value[newName], inputType);
                                        const newInItem = FormSet.createText(newName, { inputType });
                                        initSetInput && (newInItem.firstChild["value"] = value[newName]);
                                        newItem.appendChild(newInItem);
                                    }
                                    else {
                                        newItem = FormSet.createDiv({
                                            innerHTML: `<span class="fontBolder mr5">${newName}</span>`,
                                            className: 'p5 prop'
                                        });
                                        buildInputsForJson(newItem, value[newName]);
                                    }
                                    parentBox.appendChild(newItem);
                                }
                                return;
                            };
                            inputEle = FormSet.createDiv({
                                innerHTML: `<div class="fontBolder mr5">${name}</div>`,
                                className: 'p5 prop'
                            });
                            buildInputsForJson(inputEle, this.getProperty(name));
                            btnSetProp = FormSet.createSetBtn(this._instance, name, { inputType, form: 'json' });
                            break;
                        }
                        case testType.selection: {
                            const radioOptions = {};
                            initSetInput && (radioOptions['checkedIndex'] = selection.findIndex(val => val === this.getProperty(name)));
                            inputEle = FormSet.createRadio(selection, name, radioOptions);
                            inputEle.classList.add('setPropBox');
                            btnSetProp = FormSet.createSetBtn(this._instance, name, { inputType: typeof this.getProperty(name), form: 'radio' });
                            break;
                        }
                    }
                    inputEle.appendChild(btnSetProp);
                }
                divBtnBox.appendChild(inputEle);
            }
            if (hasChangeEvent)
                divBtnBox.appendChild(btnToggleChangeEvent);
            instanceForm.appendChild(divProp);
            if (hasGet)
                btnGetProp.onclick = () => this.onClickBtnGetProp(name);
            if (hasChangeEvent)
                btnToggleChangeEvent.onclick = () => {
                    btnToggleChangeEvent.disabled = true;
                    if (isAddedEventHandler) {
                        this._instance.removeEventListener(eventName, eventHandler);
                        btnToggleChangeEvent.innerHTML = getEvtName();
                    }
                    else {
                        this._instance.addEventListener(eventName, eventHandler);
                        btnToggleChangeEvent.innerHTML = getEvtName(false);
                    }
                    isAddedEventHandler = !isAddedEventHandler;
                    btnToggleChangeEvent.disabled = false;
                };
        });
        const props = {};
        defaultProperties.concat(this._properties).forEach(({ name }) => props[name] = this.getProperty(name));
        this.addText(props);
        const defaultMethodOption = { name: '', arguments: [] };
        let divMethod;
        if (this._methods && this._methods.length > 0) {
            divMethod = FormSet.createDiv({
                innerHTML: `<span class="fontBolder mr5">method</span>`,
                className: 'p5 method'
            });
        }
        (_b = this._methods) === null || _b === void 0 ? void 0 : _b.forEach(info => {
            var _a;
            const { name } = Object.assign(Object.assign({}, defaultMethodOption), info);
            const divArgsBox = FormSet.createDiv({ className: 'p2' });
            const btnCall = FormSet.createButton({ innerText: `${name}` });
            divArgsBox.appendChild(btnCall);
            divMethod.appendChild(divArgsBox);
            (_a = info.arguments) === null || _a === void 0 ? void 0 : _a.forEach(argInfo => {
                const argName = argInfo.name;
                const argType = argInfo.type;
                let inputEle;
                switch (argType) {
                    case 'text':
                        inputEle = FormSet.createElement('input', { type: 'text', placeholder: argName });
                }
                if (inputEle)
                    divArgsBox.appendChild(inputEle);
            });
            btnCall.onclick = () => {
                var _a, _b, _c;
                const arg = [];
                (_a = info.arguments) === null || _a === void 0 ? void 0 : _a.forEach((val, idx) => {
                    const input = divArgsBox.children.item(idx + 1);
                    arg.push(input.value);
                });
                (_c = (_b = this._instance) === null || _b === void 0 ? void 0 : _b[name]) === null || _c === void 0 ? void 0 : _c.call(_b, ...arg);
            };
            instanceForm.appendChild(divMethod);
        });
    }
}
TestForm.getChangeEventName = propertyName => `${propertyName.toLowerCase()}change`;
//window['console2'] = window.console;
function log(...arg) {
    console.log(`[${location.origin}]`, ...arg);
}
//# sourceMappingURL=main.js.map
