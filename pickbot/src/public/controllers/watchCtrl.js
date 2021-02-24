"use strict";

function watchCtrl($routeParams, $http, $timeout){
    let vm = this;
    vm.videoInProcess = true;
    vm.title = 'Просмотр';
    vm.errors = [];
    const ID = $routeParams.id;

    async function iterCheck(){
        let result = new Promise(resolve => {
            $http.get('/api/pp/check/'+ID).then(async res => {
                vm.uploadData = res.data;

                if(vm.uploadData.status === 'error'){
                    vm.videoInProcess = false;
                    vm.errors.push('Сожалеем, ссылка не действительна');
                    resolve('finish');
                }

                if(vm.uploadData.status === 'inprogress'){
                    resolve('continue');
                }

                if(vm.uploadData.status === 'success'){
                    vm.videoInProcess = false;
                    vm.errors = [];
                    vm.url = '/api/video/' + ID;
                    vm.dlurl = '/api/dlvideo/' + ID;
                    $timeout(()=>{
                        let player = document.getElementsByTagName('video')[0];
                        player.load();
                    },300);
                    resolve('finish');
                }

            }, err => {
                vm.videoInProcess = false;
                vm.errors.push('Сожалеем, ссылка не действительна');
                resolve('finish');
            });
        });

        if((await result) === 'continue'){
            $timeout(async ()=>{
                await iterCheck();
            },1000);
        }
    }

    iterCheck();

    resizeHook();
}