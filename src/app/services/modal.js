angular.module("proton.modals", [])

.factory('pmModal', function(
    $animate,
    $compile,
    $rootScope,
    $controller,
    $q,
    $http,
    $templateCache
) {
    return function modalFactory(config) {
        if (!(!config.template ^ !config.templateUrl)) {
            throw new Error('Expected modal to have exacly one of either template or templateUrl');
        }

        var template = config.template,
            controller = config.controller || null,
            controllerAs = config.controllerAs,
            container = angular.element(config.container || document.body),
            element = null,
            html,
            scope;

        if (config.template) {
            html = $q.when(config.template);
        } else {
            html = $http.get(config.templateUrl, {
                cache: $templateCache
            }).
            then(function(response) {
                return response.data;
            });
        }

        function activate(locals) {
            return html.then(function(html) {
                if (!element) {
                    attach(html, locals);
                }
                $(body).append('<div class="modal-backdrop fade in"></div>');
                $rootScope.modalOpen = true;
                setTimeout(function() {
                    $('.modal').addClass('in');
                }, 100);
            });
        }

        function attach(html, locals) {
            element = angular.element(html);
            if (element.length === 0) {
                throw new Error('The template contains no elements; you need to wrap text nodes');
            }
            scope = $rootScope.$new();
            if (controller) {
                if (!locals) {
                    locals = {};
                }
                locals.$scope = scope;
                var ctrl = $controller(controller, locals);
                if (controllerAs) {
                    scope[controllerAs] = ctrl;
                }
            } else if (locals) {
                for (var prop in locals) {
                    scope[prop] = locals[prop];
                }
            }
            $compile(element)(scope);
            return $animate.enter(element, container);
        }

        function deactivate() {
            if (!element) {
                return $q.when();
            }
            return $animate.leave(element).then(function() {
                scope.$destroy();
                scope = null;
                element.remove();
                element = null;
                $rootScope.modalOpen = false;
                $('.modal-backdrop').remove();
            });
        }

        function active() {
            return !!element;
        }

        return {
            activate: activate,
            deactivate: deactivate,
            active: active
        };
    };
})

// confirm modal
.factory('confirmModal', function(pmModal) {
    return pmModal({
        controller: function(params) {
            this.message = params.message;
            this.title = params.title;

            this.confirm = function() {
                if (angular.isDefined(params.confirm) && angular.isFunction(params.confirm)) {
                    params.confirm();
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/confirm.tpl.html'
    });
})

// alert modal
.factory('alertModal', function(pmModal) {
    return pmModal({
        controller: function(params) {
            this.title = params.title;
            this.message = params.message;

            if(angular.isDefined(params.alert)) {
                this.alert = params.alert;
            } else {
                this.alert = 'alert-info';
            }

            this.ok = function() {
                if (angular.isDefined(params.ok) && angular.isFunction(params.ok)) {
                    params.ok();
                }
            };
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/alert.tpl.html'
    });
})

// Advance search modal
.factory('searchModal', function(pmModal, authentication, CONSTANTS) {
    return pmModal({
        controller: function(params) {
            this.attachments = 2;
            this.starred = 2;
            this.labels = authentication.user.Labels;
            this.folders = angular.copy(CONSTANTS.MAILBOX_IDENTIFIERS);
            delete this.folders.search;
            delete this.folders.label;

            if(angular.isDefined(params.value)) {
                this.keywords = params.value;
            }

            this.setMin = function() {
                if(this.start.getDate() === null) {
                    this.start = null;
                } else {
                    this.end.setMinDate(this.start.getDate());
                }
            };

            this.setMax = function() {
                if(this.end.getDate() === null) {
                    this.end = null;
                } else {
                    this.start.setMaxDate(this.end.getDate());
                }
            };

            this.search = function() {
                if (angular.isDefined(params.search) && angular.isFunction(params.search)) {
                    var parameters = {};

                    parameters.words = this.keywords;
                    parameters.from = this.from;
                    parameters.to = this.to;
                    parameters.subject = this.subject;
                    parameters.attachments = parseInt(this.attachments);

                    if(parseInt($('#search_folder').val()) !== -1) {
                        parameters.label = $('#search_folder').val();
                    }

                    if($('#search_start').val().length > 0) {
                        parameters.begin = this.start.getMoment().unix();
                    }

                    if($('#search_end').val().length > 0) {
                        parameters.end = this.end.getMoment().unix();
                    }

                    params.search(parameters);
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/advanceSearch.tpl.html'
    });
})

// login help modal
.factory('loginModal', function(pmModal) {
    return pmModal({
        controller: function(params) {
            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/loginHelp.tpl.html'
    });
})

// contact modal
.factory('contactModal', function(pmModal) {
    return pmModal({
        controller: function(params, $timeout) {
            this.name = params.name;
            this.email = params.email;
            this.title = params.title;

            this.save = function() {
                if (angular.isDefined(params.save) && angular.isFunction(params.save)) {
                    params.save(this.name, this.email);
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

            $timeout(function() {
                $('#contactName').focus();
            }.bind(this), 100);
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/contact.tpl.html'
    });
})

// contact modal
.factory('wizardModal', function(pmModal) {
    return pmModal({
        controller: function(params, $timeout) {
            this.version = params.version;
            this.title = params.title;

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/wizard.tpl.html'
    });
})

// label modal
.factory('labelModal', function(pmModal) {
    return pmModal({
        controller: function(params, $timeout) {
            this.title = params.title;
            this.colors = [
                '#7272a7',
                '#8989ac',

                '#cf5858',
                '#cf7e7e',

                '#c26cc7',
                '#c793ca',

                '#7569d1',
                '#9b94d1',

                '#69a9d1',
                '#a8c4d5',

                '#5ec7b7',
                '#97c9c1',

                '#72bb75',
                '#9db99f',

                '#c3d261',
                '#c6cd97',

                '#e6c04c',
                '#e7d292',

                '#e6984c',
                '#dfb286'
            ];

            if(angular.isDefined(params.label)) {
                this.name = params.label.Name;
                this.color = params.label.Color;
            } else {
                this.name = '';
                this.color = this.colors[0];
            }

            this.create = function() {
                if (angular.isDefined(params.create) && angular.isFunction(params.create)) {
                    params.create(this.name, this.color);
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

            $timeout(function() {
                $('#labelName').focus();
            }.bind(this), 100);
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/label.tpl.html'
    });
})

// dropzone modal
.factory('dropzoneModal', function(pmModal) {
    return pmModal({
        controller: function(params, notify, $timeout) {
            var files = [];
            var fileCount = 0;
            var idDropzone = 'dropzone';
            var idSelectedFile = 'selectedFile';
            var extension;
            var self = this;

            this.title = params.title;
            this.message = params.message;

            function init() {
                var drop = document.getElementById(idDropzone);

                drop.ondrop = function(e) {
                    e.preventDefault();
                    extension = e.dataTransfer.files[0].name.substr(e.dataTransfer.files[0].name.length - 4);

                    if (extension !== '.csv' && extension !== '.vcf') {
                        notify('Invalid file type');
                        self.hover = false;
                    } else {
                        files = e.dataTransfer.files;
                        self.fileDropped = files[0].name;
                        self.hover = false;
                    }
                };

                drop.ondragover = function(event) {
                    event.preventDefault();
                    self.hover = true;
                };

                drop.ondragleave = function(event) {
                    event.preventDefault();
                    self.hover = false;
                };

                $('#' + idDropzone).on('click', function() {
                    $('#' + idSelectedFile).trigger('click');
                });

                $('#' + idSelectedFile).change(function(e) {
                    extension = $('#' + idSelectedFile)[0].files[0].name.substr($('#' + idSelectedFile)[0].files[0].name.length - 4);

                    if (extension !== '.csv' && extension !== '.vcf') {
                        notify('Invalid file type');
                    } else {
                        files = $('#' + idSelectedFile)[0].files;
                        self.fileDropped = $('#' + idSelectedFile)[0].files[0].name;
                        self.hover = false;
                    }
                });
            }

            this.import = function() {
                if (angular.isDefined(params.import) && angular.isFunction(params.import)) {
                    params.import(files);
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

            $timeout(function() {
                init();
            }.bind(this), 100);
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/dropzone.tpl.html'
    });
})

// Card modal
.factory('cardModal', function(pmModal, Stripe, Payment, notify, $translate) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/card.tpl.html',
        controller: function(params) {
            // Variables
            this.cardTypeIcon = 'fa-credit-card';
            this.status = params.card.Status;
            this.brand = params.card.Brand;
            this.number = '**** **** **** ' + params.card.Last4;
            this.fullname = params.card.Name;
            this.month = params.card.ExpMonth;
            this.year = params.card.ExpYear;
            this.cvc = '***';
            this.change = false;
            // Functions
            this.submit = function() {
                this.process = true;

                var stripeResponseHandler = function(status, response) {
                    if(status === 200) {
                        // Send request to change credit card
                        Payment.change({
                            Source: {
                                Object: 'token',
                                Token: response.id
                            }
                        }).then(function(result) {
                            if(angular.isDefined(result.data) && result.data.Code === 1000) {
                                notify({message: $translate.instant('CREDIT_CARD_CHANGED'), classes: 'notification-success'});
                                params.cancel();
                            } else {
                                this.process = false;
                            }
                        }.bind(this), function(error) {
                            this.process = false;
                        }.bind(this));
                    } else if(angular.isDefined(response.error)) {
                        notify({message: response.error.message, classes: 'notification-danger'});
                        this.process = false;
                    }
                }.bind(this);

                if(Stripe.card.validateCardNumber(this.number) === false) {
                    notify({message: $translate.instant('CARD_NUMER_INVALID'), classes: 'notification-danger'});
                    return false;
                }

                if(Stripe.card.validateExpiry(this.month, this.year) === false) {
                    notify({message: $translate.instant('EXPIRY_INVALID'), classes: 'notification-danger'});
                    return false;
                }

                if(Stripe.card.validateCVC(this.cvc) === false) {
                    notify({message: $translate.instant('CVC_INVALID'), classes: 'notification-danger'});
                    return false;
                }

                Stripe.card.createToken({
                    name: this.fullname,
                    number: this.number,
                    cvc: this.cvc,
                    exp_month: this.month,
                    exp_year: this.year
                }, stripeResponseHandler);
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

            this.numberChange = function() {
                var type = Stripe.card.cardType(this.number);

                switch (type) {
                    case 'Visa':
                        this.cardTypeIcon = 'fa-cc-visa';
                        break;
                    case 'MasterCard':
                        this.cardTypeIcon = 'fa-cc-mastercard';
                        break;
                    case 'Discover':
                        this.cardTypeIcon = 'fa-cc-discover';
                        break;
                    case 'Diners Club':
                        this.cardTypeIcon = 'fa-cc-diners-club';
                        break;
                    case 'JCB':
                        this.cardTypeIcon = 'fa-cc-jcb';
                        break;
                    case 'American Express':
                    case 'Unknown':
                    this.cardTypeIcon = 'fa-credit-card';
                    break;
                    default:
                        this.cardTypeIcon = 'fa-credit-card';
                        break;
                }
            };
        }
    });
})

// Payment modal
.factory('paymentModal', function(notify, pmModal, Stripe, Organization, $translate, Payment) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/payment/modal.tpl.html',
        controller: function(params) {
            // Variables
            this.process = false;
            this.step = 'payment';
            this.number = '';
            this.fullname = '';
            this.month = '';
            this.year = '';
            this.cvc = '';
            this.cardTypeIcon = 'fa-credit-card';
            this.config = params.configuration;

            // Functions
            this.submit = function() {
                this.process = true;

                var stripeResponseHandler = function(status, response) {
                    if(status === 200) {
                        // Add data from Stripe
                        this.config.Source = {
                            Object: 'token',
                            Token: response.id
                        };
                        // Send request to subscribe
                        // Organization.create(this.config).then(function(result) {
                        Payment.subscribe(this.config).then(function(result) {
                            if(angular.isDefined(result.data) && result.data.Code === 1000) {
                                this.process = false;
                                this.step = 'thanks';
                            } else if(angular.isDefined(result.data) && angular.isDefined(result.data.Error)) {
                                this.process = false;
                                // TODO notify
                            } else {
                                this.process = false;
                                // TODO notify
                            }
                        }, function(error) {
                            this.process = false;
                            // TODO notify
                        });
                    } else if(angular.isDefined(response.error)) {
                        notify({message: response.error.message, classes: 'notification-danger'});
                        this.process = false;
                    } else {
                        this.process = false;
                    }
                }.bind(this);

                if(Stripe.card.validateCardNumber(this.number) === false) {
                    notify({message: $translate.instant('CARD_NUMER_INVALID'), classes: 'notification-danger'});
                    return false;
                }

                if(Stripe.card.validateExpiry(this.month, this.year) === false) {
                    notify({message: $translate.instant('EXPIRY_INVALID'), classes: 'notification-danger'});
                    return false;
                }

                if(Stripe.card.validateCVC(this.cvc) === false) {
                    notify({message: $translate.instant('CVC_INVALID'), classes: 'notification-danger'});
                    return false;
                }

                Stripe.card.createToken({
                    name: this.fullname,
                    number: this.number,
                    cvc: this.cvc,
                    exp_month: this.month,
                    exp_year: this.year
                }, stripeResponseHandler);
            };

            this.numberChange = function() {
                var type = Stripe.card.cardType(this.number);

                switch (type) {
                    case 'Visa':
                        this.cardTypeIcon = 'fa-cc-visa';
                        break;
                    case 'MasterCard':
                        this.cardTypeIcon = 'fa-cc-mastercard';
                        break;
                    case 'Discover':
                        this.cardTypeIcon = 'fa-cc-discover';
                        break;
                    case 'Diners Club':
                        this.cardTypeIcon = 'fa-cc-diners-club';
                        break;
                    case 'JCB':
                        this.cardTypeIcon = 'fa-cc-jcb';
                        break;
                    case 'American Express':
                    case 'Unknown':
                    this.cardTypeIcon = 'fa-credit-card';
                    break;
                    default:
                        this.cardTypeIcon = 'fa-credit-card';
                        break;
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
})

.factory('userModal', function(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/user/modal.tpl.html',
        controller: function(params) {
            // Variables
            this.step = 'address';

            // Functions
            this.submit = function() {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit();
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

            this.next = function() {
                if (this.step && this.step === 'address') {
                    // do validation

                    // next step
                    this.step = 'password';
                }
                else if (this.step && this.step === 'password') {
                    // do validation

                    // next step
                    this.step = 'thanks';

                }
            };
        }
    });
})

.factory('buyDomainModal', function(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/buy.tpl.html',
        controller: function(params) {
            // Functions
            this.submit = function() {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit();
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
})

.factory('addressModal', function(pmModal, $rootScope) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/address.tpl.html',
        controller: function(params) {
            // Variables
            this.domain = params.domain;
            this.step = params.step;
            this.open = function(name) {
                $rootScope.$broadcast(name, params.domain);
            };
            // Functions
            this.submit = function() {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit(this.address);
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
})

.factory('domainModal', function(pmModal, $rootScope) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/domain.tpl.html',
        controller: function(params) {
            this.name =  (params.domain && params.domain.DomainName) ? params.domain.DomainName : '';
            this.step = params.step;
            this.open = function(name) {
                $rootScope.$broadcast(name, params.domain);
            };
            // Functions
            this.submit = function() {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit(this.name);
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
})

.factory('storageModal', function(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/storage.tpl.html',
        controller: function(params) {
            this.member = params.member;
            // Functions
            this.submit = function() {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit();
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
})

.factory('verificationModal', function(pmModal, $rootScope) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/verification.tpl.html',
        controller: function(params) {
            this.domain = params.domain;
            this.step = params.step;
            this.open = function(name) {
                $rootScope.$broadcast(name, params.domain);
            };
            this.submit = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.submit();
                }
            };
            this.close = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.close();
                }
            };
        }
    });
})

.factory('spfModal', function(pmModal, $rootScope) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/spf.tpl.html',
        controller: function(params) {
            this.domain = params.domain;
            this.step = params.step;
            this.open = function(name) {
                $rootScope.$broadcast(name, params.domain);
            };
            this.submit = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.submit();
                }
            };
            this.close = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.close();
                }
            };
        }
    });
})

.factory('mxModal', function(pmModal, $rootScope) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/mx.tpl.html',
        controller: function(params) {
            this.domain = params.domain;
            this.step = params.step;
            this.open = function(name) {
                $rootScope.$broadcast(name, params.domain);
            };
            this.submit = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.submit();
                }
            };
            this.close = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.close();
                }
            };
        }
    });
})

.factory('dkimModal', function(pmModal, $rootScope) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/dkim.tpl.html',
        controller: function(params) {
            this.domain = params.domain;
            this.step = params.step;
            this.open = function(name) {
                $rootScope.$broadcast(name, params.domain);
            };
            this.submit = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.submit();
                }
            };
            this.close = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.close();
                }
            };
        }
    });
})

.factory('dmarcModal', function(pmModal, $rootScope) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/dmarc.tpl.html',
        controller: function(params) {
            this.domain = params.domain;
            this.step = params.step;
            this.open = function(name) {
                $rootScope.$broadcast(name, params.domain);
            };
            this.submit = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.submit();
                }
            };
            this.close = function() {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.close();
                }
            };
        }
    });
})

.factory('bugModal', function(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/bug.tpl.html',
        controller: function(params) {
            // Variables
            this.form = params.form;
            this.form.attachScreenshot = true; // Attach screenshot by default
            // Functions
            this.submit = function() {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit(this.form);
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
})

.factory('supportModal', function(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/support.tpl.html',
        controller: function(params) {
            // Variables

            // Functions
            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
})

// Modal to delete account
.factory('deleteAccountModal', function(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/deleteAccount.tpl.html',
        controller: function(params) {
            // Variables

            // Functions
            this.submit = function() {
                if (angular.isDefined(params.submit) && angular.isFunction(params.submit)) {
                    params.submit();
                }
            };

            this.cancel = function() {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };
        }
    });
});
