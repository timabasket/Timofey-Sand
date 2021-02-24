"use strict";

function recCtrl($scope, $location, $http, $routeParams, $timeout, Upload) {

    let
        vm = this,
        mediaSource,
        mediaRecorder,
        recordedBlobs,
        sourceBuffer;

    const
        VIDEOAREA_REC_MODE = "rec",
        VIDEOAREA_PLAY_MODE = "play",
        VIDEOAREA_DEFAULT_CONSTRAINTS = { // recorder defaults
            audio: {
                echoCancellation: {exact: true}
            },
            video: {
                width: { min: 720, max: 1920 },
                height: { min: 720, max: 1920 },
                frameRate: { min: 10, max: 50 },
                facingMode: (undefined === $routeParams.mode) ? 'user' : ['user', 'environment'].indexOf($routeParams.mode) > -1 ? $routeParams.mode : 'user'
            }
        },
        ID = $routeParams.id,
        videoArea = document.querySelector('video#rec-area')
        ;

    vm.errors = [];
    vm.mode = 'std'; // std or legacy mode by default
    vm.selectedMode = 'legacy';
    vm.apiStatus = 'free'; // free or busy
    vm.apiStatusBusyCounter = 0;
    vm.screen = (undefined === $routeParams.mode) ? 'v-index' : 'v-start';
    vm.recordTotalSec = 7; // 15!
    vm.recordCurSec = 0;
    vm.recordCurPercent = 0;
    vm.pageIsLoading = true;
    vm.showProgress = true;
    vm.title = 'VideoMaker';
    vm.uploadProgress = 0;
    vm.uploadVideoDots = '';
    vm.videoAreaMode = VIDEOAREA_REC_MODE;
    vm.videoConstraints = VIDEOAREA_DEFAULT_CONSTRAINTS;
    vm.recordInProgress = false;
    vm.showCamsToggleBtn = false;

    // check support MediaSource object in browser
    try {
        // init mediaSource if supported
        mediaSource = new MediaSource();
    } catch (e) {
        // switch to legacy mode otherwise
        vm.mode = 'legacy';
    }

    /**
     * rec functions -- begin
     */

    function handleSuccess(stream) {
        window.stream = stream;
        videoArea.srcObject = stream;
        $timeout(() => {
            vm.pageIsLoading = false;
            vm.showProgress = false;
            $scope.$apply();
        }, 1000);
    }

    function handleSourceOpen(event) {
        sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
    }

    function handleDataAvailable(event) {
        //console.log('handleDataAvailable', event);
        if (event.data && event.data.size > 0) {
            recordedBlobs.push(event.data);
        }
    }

    async function init(constraints) {
        if(vm.selectedMode!=='std'){
            return;
        }
        vm.videoAreaMode = VIDEOAREA_REC_MODE;
        vm.camModeBtnText = (vm.videoConstraints.video.facingMode === "user") ? "Задняя камера" : "Передняя камера";

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            handleSuccess(stream);
        } catch (e) {
            vm.pageIsLoading = false;
            vm.showProgress = false;
            vm.errors.push(`Ошибка: ${e.toString()}`);
        }
    }

    function checkAndInit(){
        $http.get('/api/pp/upload/' + ID).then(async res => {
            vm.uploadData = res.data;
            let videoDevices = (await navigator.mediaDevices.enumerateDevices()).filter(each => {
                return each.kind === 'videoinput';
            });
            vm.showCamsToggleBtn = (videoDevices.length > 1);
            if (!videoDevices.length) {
                vm.pageIsLoading = true;
                vm.showProgress = false;
                //vm.errors.push('Сожалеем, но мы не нашли камеру на вашем устройстве.');
                //vm.screen = 'v-error';
                vm.mode = 'legacy';
                $scope.$apply();
            } else {
                await init(vm.videoConstraints);
            }
        }, err => {

            function elseCB() {
                vm.pageIsLoading = true;
                vm.showProgress = false;
                vm.errors.push('Сожалеем, ссылка неактивна. Попробуйте получить ссылку заново.');
                vm.screen = 'v-error';
            }

            if(err.data.errors) {
                if(err.data.errors.indexOf('api is busy') > -1){
                    vm.apiStatus = 'busy';
                    vm.apiStatusBusyCounter = 10;

                    function iterCounter() {
                        console.log('iter');
                        if(vm.apiStatusBusyCounter > 0) {
                            $timeout(()=>{
                                vm.apiStatusBusyCounter--;
                                $timeout(()=>{
                                    $scope.$apply();
                                    iterCounter();
                                },10)
                            },1000);
                        } else {
                            location.reload();
                        }
                    }
                    iterCounter();


                } else {
                    elseCB();
                }
            } else {
                elseCB();
            }

        });
    }

    function recTimer() {
        if (vm.recordCurSec >= 0 && vm.recordCurSec < vm.recordTotalSec && vm.recordInProgress) {
            $timeout(async () => {
                vm.recordCurSec += 0.5;
                vm.recordCurPercent = parseInt((vm.recordCurSec * 100) / vm.recordTotalSec);
                $scope.$apply();
                await recTimer();
            }, 500);
        }
        if (vm.recordCurSec === vm.recordTotalSec) {
            vm.stopRec();
        }
    }

    function playRecordedVideo(){
        const playArea = document.querySelector('video#play-area');
        const superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
        playArea.src = null;
        playArea.srcObject = null;
        playArea.src = window.URL.createObjectURL(superBuffer);
        playArea.controls = true;
        playArea.play();
        vm.videoAreaMode = VIDEOAREA_PLAY_MODE;
    }

    /**
     * rec functions -- end
     */

    vm.initRecorder = () => {
        vm.selectedMode = 'std';
        mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
        vm.screen='v-start'
        checkAndInit();
    };

    vm.startRec = () => {
        vm.videoAreaMode = 'rec';
        vm.recordInProgress = true;
        vm.recordCurSec = 0;

        recordedBlobs = [];
        let options = {mimeType: 'video/webm;codecs=vp9'};

        try {
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.error(`${options.mimeType} is not Supported`);
                //errorMsgElement.innerHTML = `${options.mimeType} is not Supported`;
                options = {mimeType: 'video/webm;codecs=vp8'};
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    console.error(`${options.mimeType} is not Supported`);
                    //errorMsgElement.innerHTML = `${options.mimeType} is not Supported`;
                    options = {mimeType: 'video/webm'};
                    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                        console.error(`${options.mimeType} is not Supported`);
                        //errorMsgElement.innerHTML = `${options.mimeType} is not Supported`;
                        options = {mimeType: ''};
                    }
                }
            }
        } catch (e) {
            //
        }

        try {
            mediaRecorder = new MediaRecorder(window.stream, options);
        } catch (e) {
            //console.error('Exception while creating MediaRecorder:', e);
            //errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
            return;
        }

        mediaRecorder.onstop = (event) => {
            //
        };

        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.start(100);

        recTimer();
    };

    vm.stopRec = () => {
        vm.recordCurPercent = 0;
        vm.recordInProgress = false;
        $timeout(() => {
            $scope.$apply();
        });

        mediaRecorder.stop();

        $timeout(()=>{
            playRecordedVideo();
        });
    };

    vm.preview = () => {
        playRecordedVideo();
    };

    vm.startUpload = () => {
        const dotLength = 15;
        function iterVideoDots() {
            if (vm.uploadProgress > 99) {
                if (vm.uploadVideoDots.length > dotLength) {
                    vm.uploadVideoDots = '';
                } else {
                    vm.uploadVideoDots += '.';
                    $timeout(() => {
                        $scope.$apply();
                    }, 400);
                }
            }
            $timeout(() => {
                iterVideoDots();
            }, 800);
        }

        iterVideoDots();

        const blob = new Blob(recordedBlobs, {type: 'video/webm'});
        let formdata = new FormData();

        formdata.append('template', vm.uploadData.template);
        formdata.append('fragments', blob);

        jq.ajax({
            headers: {
                'upload-id': ID
            },
            url: '/api/pp',
            data: formdata,
            cache: false,
            contentType: false,
            processData: false,
            type: 'POST',
            xhr: function () {
                var xhr = jq.ajaxSettings.xhr();
                xhr.upload.onprogress = function (e) {
                    // For uploads
                    if (e.lengthComputable) {
                        var percentComplete = e.loaded / e.total;
                        vm.uploadProgress = Math.round(percentComplete * 100);
                        $timeout(() => {
                            $scope.$apply();
                        }, 10);
                    }
                };
                return xhr;
            },

            beforeSend: function () {
                //
            },

            complete: function (res) {

                const status = res.status;
                const response = res.responseText;

                if (200 === status) {
                    let responseJson;
                    try {
                        responseJson = JSON.parse(response);
                        if (responseJson.errors) {
                            vm.errors = vm.errors.concat(responseJson.errors);
                        } else {
                            vm.pageIsLoading = true;
                            vm.showProgress = true;
                            vm.thanksMessageText = vm.uploadData.thanksText;
                            $timeout(() => {
                                $scope.$apply();
                            });
                            $timeout(() => {
                              //  $location.path('/watch/' + responseJson.task._id);
                                document.location.href = '/#!/watch/' + responseJson.task._id;
                                location.reload();
                            }, 500);
                        }
                    } catch (e) {
                        vm.errors.push(response);
                    }
                    $timeout(() => {
                        $scope.$apply();
                    });
                } else {
                    $location.path('/error');
                }
            }
        });
    };

    vm.upload = file => {
        Upload.upload({
            headers: {
                'upload-id': ID
            },
            url: '/api/pp',
            data: {fragments: file, 'template': vm.uploadData.template}
        }).then(function (res) {
                const status = res.status;
                if (200 === status) {
                    try {
                        if (res.data.errors) {
                            vm.errors = vm.errors.concat(res.data.errors);
                        } else {
                            vm.pageIsLoading = true;
                            vm.showProgress = true;
                            vm.thanksMessageText = vm.uploadData.thanksText;
                            $timeout(() => {
                                $scope.$apply();
                            });
                            $timeout(() => {
                                $location.path('/watch/' + res.data.task._id);
                            }, 3000);
                        }
                    } catch (e) {
                        vm.errors.push(res.data);
                    }
                    $timeout(() => {
                        $scope.$apply();
                    });
                } else {
                    $location.path('/error');
                }
            }
            , function (resp) {
                //
            }, function (evt) {
                vm.uploadProgress = parseInt(100.0 * evt.loaded / evt.total);
                $timeout(() => {
                    $scope.$apply();
                }, 10);
            });
    };

    // if download need...
    /** vm.startDownload = () => {
         const blob = new Blob(recordedBlobs, {type: 'video/webm'});
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.style.display = 'none';
         a.href = url;
         a.download = 'test.webm';
         document.body.appendChild(a);
         a.click();
         setTimeout(() => {
             document.body.removeChild(a);
             window.URL.revokeObjectURL(url);
         }, 100);
    };*/

    vm.toggleCamMode = async () => {
        const path = (vm.videoConstraints.video.facingMode === "user") ? "environment" : "user";
        const currentHashParts = location.hash.split('/');
        const basePath = [currentHashParts[0], currentHashParts[1], currentHashParts[2]].join('/');
        const newPath = [basePath, path].join('/');
        location.replace(newPath);
        location.reload();
    };

    if ('function' !== typeof MediaRecorder) {
        vm.mode = 'legacy';
    }

    if($routeParams.mode){
        vm.selectedMode = 'std';
        mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
    }
    checkAndInit();

    resizeHook();
}
