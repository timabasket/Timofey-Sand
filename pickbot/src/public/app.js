const jq = jQuery;

function resizeHook(){
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    let listnr = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    window.removeEventListener('resize', listnr);
    window.addEventListener('resize', listnr);
}

let config = ($routeProvider) => {
    $routeProvider
        .when('/', {
            templateUrl: 'views/index.html',
            controller: 'indexCtrl',
            controllerAs: 'vm'
        })
        .when('/rec/:id/:mode?', {
            templateUrl: 'views/rec.html',
            controller: 'recCtrl',
            controllerAs: 'vm'
        })
        .when('/success', {
            templateUrl: 'views/success.html',
            controller: 'successCtrl',
            controllerAs: 'vm'
        })
        .when('/watch/:id', {
            templateUrl: 'views/watch.html',
            controller: 'watchCtrl',
            controllerAs: 'vm'
        })
        .when('/error', {
            templateUrl: 'views/error.html',
            controller: 'errorCtrl',
            controllerAs: 'vm'
        })
        .otherwise({redirectTo: '/'});
};

angular
    .module('myApp', ['ngRoute', 'ngFileUpload'])
    .controller('indexCtrl', indexCtrl)
    .controller('recCtrl', recCtrl)
    .controller('successCtrl', successCtrl)
    .controller('watchCtrl', watchCtrl)
    .controller('errorCtrl', errorCtrl)
    .config(['$routeProvider', config])
;