// close tasks
define(['jquery', 'underscore', 'twigjs'], function ($, _, Twig) {
    var CustomWidget = function () {
        var self = this,
            system = self.system(),
            langs = self.langs,
            checkboxes = {},
            task_id = 0; // ID задачи

        // количество символов для закрытия задачи
        this.close_task_length = null;

        // вытаскиваем данные из системной переменной
        this.toSettings = function () {
            self.checkboxes = self.get_settings().checkboxes_close || {};
            if (typeof self.checkboxes !== 'string') self.checkboxes = JSON.stringify(self.checkboxes);
            self.checkboxes = JSON.parse(self.checkboxes);

            return self.checkboxes;
        }

        // обнуляем данные в системной переменной
        this.saveSettings = function (checkboxes) {
            $(`#${ self.get_settings().widget_code }_custom`).val(JSON.stringify(checkboxes));
            $(`#${ self.get_settings().widget_code }_custom`).trigger('change');
        }

        // textarea change function
        this.textareaChange = function (e) {
            self.task_id = $(e.target).next().attr('id');
            var textarea = $(`div[data-id="${ self.task_id }"] textarea[name="result"]`);
            var button = $(`div[data-id="${ self.task_id }"] textarea[name="result"]`).next();
            if (textarea.val().length < self.close_task_length) textarea.val('');

            // возвращаем стандартные цвета
            textarea.css('border-color', '#d7d8da');
            button.css('border-color', '#4c8bf7').css('background', '#4c8bf7');
            button.removeClass('true_error_message');

            self.task_id = null;
        }

        // button close task function
        this.btnTaskClose = function (e) {
            // проверка закрытия задачи
            self.task_id = $(e.target).attr('id');
            if (!self.task_id) self.task_id = $(e.target).closest('button').attr('id');

            // удаляем лишние пробелы в строке
            var textarea = $(`div[data-id="${ self.task_id }"] textarea[name="result"]`);
            var button = $(`div[data-id="${ task_id }"] .card-task__button`);
            textarea.val(textarea.val().trim());

            // если проверка не пройдена
            if (textarea.val().length < self.close_task_length) {
                // добавляем класс ошибки к кнопке, красим поля и останавливаем
                button.addClass('true_error_message');
                self.showErrorMessageTask();
                self.redFieldsTaskClose();

                self.task_id = null;
                return false;
            }

            // удаляем класс ошибки с кнопки в случае успеха
            button.removeClass('true_error_message');
            self.task_id = null;
            return true;
        }

        // функция закрытия задачи
        const closeTasks = function(mutationsList) {
            // отслеживаем изменение потомков для поиска элементов
            if (AMOCRM.isCard() || AMOCRM.getBaseEntity() === 'todo') {
                $.each(mutationsList, function () {
                    if (this.type === 'childList') {

                        var button = $('div.card-task .card-task__button');
                        var textarea = $('div.card-task textarea[name="result"]');

                        // если мы в сделках
                        if (AMOCRM.isCard() && AMOCRM.getBaseEntity() === 'leads') {
                            // функция проверки пользователя и статуса
                            const isActiveUserStatus = function () {
                                // если обязательность не стоит, пропускаем проверку
                                var checkboxes = self.toSettings();
                                if (!checkboxes.isChecked) return false;

                                // если текущего пользователя в настройках нет, пропускаем проверку
                                var manager = AMOCRM.constant('user').id;
                                var isUser = false;
                                $.each(checkboxes.managers, function (key, val) {
                                    if (manager == val) isUser = true;
                                });
                                if (!isUser) return false;

                                // если статуса сделки в настройках нет, пропускаем проверку
                                var pipelineID, statusID, isStatus = false;
                                if (AMOCRM.data.current_card) {
                                    pipelineID = AMOCRM.data.current_card.model.attributes['lead[PIPELINE_ID]'];
                                    statusID = AMOCRM.data.current_card.model.attributes['lead[STATUS]'];
                                }

                                if (!checkboxes.statuses || checkboxes.statuses.length === 0) return;
                                $.each(checkboxes.statuses, function (key, val) {
                                    val = val.split('_');
                                    if (pipelineID === val[1] && statusID === val[2]) isStatus = true;
                                });
                                if (!isStatus) return false;

                                return true;
                            }

                            // обнуление textarea в случае несоответствия длины
                            if (AMOCRM.isCard() === true) {
                                textarea.unbind('change');
                                textarea.bind('change', function (e) {
                                    // если текущего пользователя и статуса нет, проверку не делаем
                                    if (!isActiveUserStatus()) return;
                                    self.textareaChange(e);
                                });
                            }

                            // проверка с нажатием на кнопку
                            button.unbind('click');
                            button.bind('click', function (e) {
                                // если текущего пользователя и статуса нет, проверку не делаем
                                if (!isActiveUserStatus()) return;
                                if (!self.btnTaskClose(e)) return false;
                            });

                            // иначе, если в задачах или других карточках
                        } else {
                            // функция проверки пользователя
                            const isActiveUser = function () {
                                // если обязательность не стоит, пропускаем проверку
                                var checkboxes = self.toSettings();
                                if (!checkboxes.isChecked) return false;

                                // если текущего пользователя в настройках нет, пропускаем проверку
                                var manager = AMOCRM.constant('user').id;
                                var isUser = false;
                                $.each(checkboxes.managers, function (key, val) {
                                    if (manager == val) isUser = true;
                                });
                                if (!isUser) return false;

                                return true;
                            }

                            // обнуление textarea в случае несоответствия длины
                            if (AMOCRM.isCard() === true) {
                                textarea.unbind('change');
                                textarea.bind('change', function (e) {
                                    // если текущего пользователя нет, проверку не делаем
                                    if (!isActiveUser()) return;
                                    self.textareaChange(e);
                                });
                            }

                            // проверка с нажатием на кнопку
                            button.unbind('click');
                            button.bind('click', function (e) {
                                // если текущего пользователя нет, проверку не делаем
                                if (!isActiveUser()) return;
                                if (!self.btnTaskClose(e)) return false;
                            });
                        }
                    }
                });
            }
        }

        // this.observerCreateTasks = new MutationObserver(createTasks);
        this.observerCloseTasks = new MutationObserver(closeTasks);

        // функция показа сообщения об ошибке
        this.showErrorMessageTask = function () {
            var errorMessage = $('div.close_error_message_tasks');
            var left, top,
                button = $(`div[data-id="${ self.task_id }"] .card-task__button`);

            // отображаем сообщение
            errorMessage.css('display', 'block');

            // позиционируем относительно кнопки
            var resize = function () {
                left = button.offset().left - errorMessage.outerWidth() + button.outerWidth();

                if (button.offset().top > 100) top = button.offset().top - errorMessage.outerHeight() - 30;
                else top = button.offset().top + button.outerHeight() + 30;

                errorMessage.offset({
                    left: left,
                    top: top
                });
            }

            resize();

            // при наведении мыши на кнопку показываем
            button.mouseover(function () {
                if (button.hasClass('true_error_message')) {
                    errorMessage.css('display', 'block');
                    resize();
                }
            });

            // при потере фокуса скрываем
            button.mouseout(function () { errorMessage.css('display', 'none') });
        }

        // функция смены цвета полей при ошибке закрытия задачи
        this.redFieldsTaskClose = function () {
            var button = $(`div[data-id="${ self.task_id }"] .card-task__button`);
            var textarea = $(`div[data-id="${ self.task_id }"] textarea[name="result"]`);

            // красим поля, если условие проверки не выполнено
            button.addClass('true_error_message');
            button.css('border-color', '#f37575').css('background', '#f57d7d');
            button.css({
                'border-color': '#f37575',
                'background': '#f57d7d'
            });
            textarea.css('border-color', '#f37575');

            // возвращаем цвет textarea и/или кнопки в случае успеха
            textarea.bind('input', function () {
                // если обязательность не стоит, пропускаем проверку
                var checkboxes = self.toSettings();
                if (!checkboxes.isChecked) return;

                // если длина textarea меньше допустимой
                if (textarea.val().trim().length < self.close_task_length) {
                    button.addClass('true_error_message');
                    textarea.css('border-color', '#f37575');
                    button.css('border-color', '#f37575').css('background', '#f57d7d');
                } else {
                    // иначе, если textarea соответствует условию
                    button.removeClass('true_error_message');
                    textarea.css('border-color', '#d7d8da');
                    button.css('border-color', '#4c8bf7').css('background', '#4c8bf7');
                    $('div.close_error_message_tasks').css('display', 'none');
                }
            });
        }

        // функиця вызова всплывающих сообщений над кнопкой
        this.getTemplate = function (template, params, callback) {
            params = (typeof params == 'object') ? params : {};
            template = template || '';

            return self.render({
                href: '/templates/' + template + '.twig',
                base_path: self.params.path,
                load: callback
            }, params);
        };

        // функция добавления checkbox
        this.addCheckbox = function (input_class_name, name, id, value) {
            var checkbox = self.render(
                { ref: '/tmpl/controls/checkbox.twig' },
                { input_class_name, name, id, value, text: value }
            );

            return checkbox;
        }

        // вывод пользователей и статусов в настройки
        this.lastSettings = function (checkboxes) {
            // обнуляем системную переменную
            checkboxes.isChecked = true;
            self.saveSettings(checkboxes);

            var linkUsers = `
                        <div class="widget_settings_block__item_field subscribers__wrapper">
                            <div class="widget_settings_block__input_field" style="width: 100%;">
                                <div class="subscribers" style="position: relative;">
                                    <a href="" class="js-toggle linkUsers" style="font-size: 16px;">
                                        Участники:&nbsp;
                                        <span id="show-chat-list-length" class="js-counter">
                                            0
                                        </span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    `;

            // показываем ссылку участников
            $('.close_task_checkbox_wrapper').after(linkUsers);
            $('.subscribers__wrapper .js-counter').text(checkboxes.managers ? checkboxes.managers.length : 0);

            // отображаем форму с пользователями
            $('a.linkUsers').unbind('click');
            $('a.linkUsers').bind('click', function (e) {
                e.preventDefault();

                // wrapper, кнопки и поиск
                $('.subscribers').append(`
                            <div class="subscribers-container js-container subscribers-container--full" style="display: block; width: 250px;">
                                <div class="js-view-container" style="background: #fff;">
                                
                                    <div class="subscribers-full">
                                        <div class="js-users-picker users-picker">
                                            <div data-multisuggest-id="5499">
                                            
                                                <div class="users-picker-controls js-users-picker-controls users-picker-controls--disabled" style="background: #fff;">
                                                    <button class="users-picker-controls__cancel js-users-picker-controls-cancel" style="cursor: pointer;">
                                                        Отменить
                                                    </button>
                                                    <button class="users-picker-controls__save js-users-picker-controls-save" style="cursor: pointer;">
                                                        Сохранить
                                                    </button>
                                                </div>
                                                
                                                <div class="users-picker-search" style="background: #fff;">
                                                    <span class="users-picker-search__icon">
                                                        <svg class="svg-icon svg-common--filter-search-dims">
                                                            <use xlink:href="#common--filter-search"></use>
                                                        </svg>
                                                    </span>
                                                    <input class="users-picker-search__field js-multisuggest-input" style="width: 5px;">
                                                    <tester style="position: absolute; top: -9999px; left: -9999px; width: auto; font-size: 14px; 
                                                        font-family: &quot;PT Sans&quot;, Arial, sans-serif; font-weight: 400; font-style: normal; 
                                                        letter-spacing: 0px; text-transform: none; white-space: pre;">
                                                    </tester>
                                                </div>
                                                
                                            </div>
                                        <div class="js-multisuggest-suggest" data-multisuggest-id="5499" style="display: block;">
                                    </div>
                                    
                                    <div class="js-multisuggest-list" data-is-suggest="y" data-multisuggest-id="5499" style="display: block;">
                                        <div class="multisuggest__suggest js-multisuggest-suggest custom-scroll" style="max-height: 270px;">
                                            <div class="users-select-row"></div>
                                        </div>
                                    </div>
                        
                                </div>
                            </div>
                        `);

                // пользователи и группы
                var groups = AMOCRM.constant('groups'),
                    managers = AMOCRM.constant('managers');

                // перебираем группы и пользователей этих групп
                $.each(groups, function (key, value) {
                    var users = [], groupID = key;

                    $.each(managers, function () {
                        if (this.group != key) return;
                        if (!this.active) return;
                        users.push({ id: this.id, title: this.title });
                    });

                    // добавляем группу, если в ней есть пользователи
                    if (!users.length) return;
                    $('.multisuggest__suggest').append(`
                                <div class="users-select-row__inner group-color-wrapper">
                                    <div class="users-picker-item users-picker-item--group  users-select__head group-color multisuggest__suggest-item"
                                        data-title="${ value }" data-group="y" data-id="${ groupID }">
                                        <div class="users-picker-item__title users-select__head-title">
                                            <span>${ value }</span>
                                        </div>
                                        <div class="users-picker-item__pin">
                                            <svg class="svg-icon svg-cards--pin-dims">
                                                <use xlink:href="#cards--pin"></use>
                                            </svg>
                                        </div>
                                    </div>
                                    <div class="users-select__body" data-id="${ groupID }"></div>
                                </div>
                            `);

                    // добавляем пользователей к группе
                    $.each(users, function () {
                        $(`.users-select__body[data-id="${ groupID }"]`).append(`
                            <div class="users-picker-item users-select__body__item"
                                id="select_users__user-${ this.id }" data-group="${ groupID }" data-id="${ this.id }">
                                <div class="users-picker-item__title multisuggest__suggest-item js-multisuggest-item true">
                                    ${ this.title }
                                </div>
                                <div class="users-picker-item__pin users-picker-select">
                                    <svg class="svg-icon svg-cards--pin-dims">
                                        <use xlink:href="#cards--pin"></use>
                                    </svg>
                                </div>
                            </div>
                        `);
                    });
                });

                // search
                $('.users-picker-search__field').bind('input', function () {
                    var searchVal = $(this).val().toLowerCase();

                    // перебираем пользователей на совпадения
                    $.each($('.users-picker-item__title'), function () {
                        var itemText = $(this).text().toLowerCase();

                        // если есть, остальных скрываем
                        if (!itemText.includes(searchVal)) {
                            if ($(this).parent().hasClass('users-picker-item--group')) return;
                            $(this).parent().addClass('hidden');
                        } else $(this).parent().removeClass('hidden');
                    });

                    // если в группе пользователей не осталось, прячем группу
                    $.each($('.users-select-row__inner'), function () {
                        var items = $(this).find('.users-select__body__item'),
                            counter = 0;

                        $.each(items, function () {
                            if ($(this).hasClass('hidden')) return;
                            counter++;
                        });

                        if (counter > 0) $(this).removeClass('hidden');
                        else $(this).addClass('hidden');
                    });
                });

                // отмечаем выбранных ранее пользователей
                $.each($('.users-select__body__item'), function () {
                    var itemID = $(this).attr('data-id');
                    if (!checkboxes.managers || !checkboxes.managers.includes(itemID)) return;
                    if ($(this).hasClass('users-picker-item--selected')) return;;
                    $(this).addClass('users-picker-item--selected');
                });

                // выбор пользователя
                $('.users-select__body__item').unbind('click');
                $('.users-select__body__item').bind('click', function (e) {
                    e.stopPropagation();
                    var userID = $(e.target).closest('.users-select__body__item').attr('data-id');
                    $(e.target).closest('.users-select__body__item').toggleClass('users-picker-item--selected');
                    $('.users-picker-controls').removeClass('users-picker-controls--disabled');
                });

                // выбор группы пользователей
                $('.users-picker-item--group').unbind('click');
                $('.users-picker-item--group').bind('click', function (e) {
                    e.stopPropagation();
                    var groupID = $(e.target).closest('.users-picker-item--group').attr('data-id');

                    $(e.target).closest('.users-picker-item--group').toggleClass('users-picker-item--selected');
                    groupItems = $(`.users-select__body[data-id="${ groupID }"]`).find('.users-select__body__item');
                    $('.users-picker-controls').removeClass('users-picker-controls--disabled');

                    if ($(`.users-picker-item--group[data-id="${ groupID }"]`).hasClass('users-picker-item--selected')) {
                        $.each(groupItems, function () {
                            if ($(this).hasClass('users-picker-item--selected')) return;
                            $(this).addClass('users-picker-item--selected');
                        });
                    } else {
                        $.each(groupItems, function () {
                            if (!$(this).hasClass('users-picker-item--selected')) return;
                            $(this).removeClass('users-picker-item--selected');
                        });
                    }
                });

                // выравниваем пользователей относительно ссылки
                $('.js-view-container').css('border', '1px solid #c3c3c3');
                $('.subscribers-container').css({
                    'left': '0',
                    'top': '0',
                    'border': '0'
                });

                // прячем список пользователей
                $('.widget-settings').unbind('click');
                $('.widget-settings').bind('click', function (e) {
                    // если это не ссылка, не счетчик и не сама форма, удаляем форму
                    if ($(e.target).closest('.subscribers-container').length) return;
                    if ($(e.target).hasClass('linkUsers')) return;
                    if ($(e.target).parent().hasClass('linkUsers')) return;
                    $('.subscribers-container').remove();
                });

                // события кнопок отменить и сохранить
                $('.js-users-picker-controls-cancel').bind('click', () => { $('.subscribers-container').remove() });
                $('.users-picker-controls__save').bind('click', function () {
                    var items = $('.users-select__body__item'),
                        managers = [];

                    $.each(items, function () {
                        if (!$(this).hasClass('users-picker-item--selected')) return;
                        managers.push($(this).attr('data-id'));
                    });

                    checkboxes.managers = managers;
                    self.saveSettings(checkboxes);
                    $('.subscribers-container').remove();
                    $('.subscribers .js-counter').text(managers.length);
                });

            });

            // воронки и статусы
            $.ajax({
                url: '/api/v4/leads/pipelines',
                success: function (data) {
                    var pipelines = [];

                    $.each(data._embedded.pipelines, function () {
                        var pipeline_ID = this.id,
                            pipeline_name = this.name;

                        // добавляем воронки
                        pipelines.push({ id: pipeline_ID, name: pipeline_name, statuses: [] });

                        $.each(this._embedded.statuses, function () {
                            if (this.type == 1) return;

                            var status_ID = this.id,
                                status_name = this.name,
                                status_color = this.color;

                            // добавляем к воронкам статусы
                            $.each(pipelines, function () {
                                if (this.id !== pipeline_ID) return;
                                this.statuses.push({
                                    id: status_ID,
                                    name: status_name,
                                    color: status_color
                                });
                            });
                        });
                    });

                    // pipelines select
                    var pipeline = Twig({ ref: '/tmpl/controls/pipeline_select/index.twig' }).render({
                            has_pipelines: true,
                            items: pipelines,
                            multiple: true,
                            class_name: 'modal__pipelines-settings',
                            id: 'pipelinesSettings'
                        }),
                        pipelinesWrapper = `
                            <div class="widget_settings_block__item_field pipelines__wrapper">
                                <div class="widget_settings_block__input_field" style="width: 100%;">
                                    <div class="modal__pipelines__wrapper">
                                        <span style="width: 100%;">Воронки, этапы:</span>
                                    </div>
                                </div>
                            </div>`;

                    $('.subscribers__wrapper').after(pipelinesWrapper);
                    $('.pipelines__wrapper').append(pipeline);
                    $('.pipelines__wrapper').css('margin-top', '3px');

                    $('.pipeline-select').unbind('click');
                    $('.pipeline-select').bind('click', function () { $('.subscribers-container').remove() });

                    // отображаем ранее выбранные статусы
                    if (checkboxes.statuses && checkboxes.statuses.length > 0) {
                        $.each(checkboxes.statuses, function (key, val) {
                            val = val.split('_');
                            var statusItem = $(`input[data-value="${val[2]}"]`);
                            if (!$(statusItem).closest('label').hasClass('is-checked')) {
                                $(statusItem).closest('label').addClass('is-checked');
                                $(statusItem).closest('label').trigger('click');
                            }
                        });
                    }

                    // сохраняем выбранные статусы
                    $('.pipeline-select').unbind('change');
                    $('.pipeline-select').bind('change', function (e) {
                        var statuses = [];

                        $.each($('.pipeline-select__dropdown__item__label'), function () {
                            if (!$(this).hasClass('is-checked')) return;
                            statuses.push($(this).find('input').attr('id'));
                        });

                        checkboxes.statuses = statuses;
                        self.saveSettings(checkboxes);
                    });
                },
                timeout: 2000
            });
        }

        // функция добавления checkbox для выбора пользователей и воронок со статусами
        this.addCheckboxSettings = function () {
            var blockControls = $('div.widget_settings_block__controls');

            // вытаскиваем данные из системной переменной
            var checkboxes = self.toSettings();

            // checbox выполнения задачи
            var closeTaskCheckbox = self.addCheckbox(
                'close_task_checkbox',
                'close-task-checkbox',
                null,
                'Обязательность выполнения задачи'
            );

            // checboxes wrapper
            var divCloseTaskCheckbox = `
                <div class="widget_settings_block__item_field close_task_checkbox_wrapper" style="margin-top: 5px;">
                    <div class="widget_settings_block__input_field">
                        ${ closeTaskCheckbox }
                    </div>
                </div>
            `;

            // добавляем checkbox'ы в настройки
            blockControls.before(divCloseTaskCheckbox);
            closeTaskCheckbox = $('.close_task_checkbox_wrapper .control-checkbox');

            // отображаем ранее сохраненные настройки
            if (checkboxes.isChecked) {
                closeTaskCheckbox.addClass('is-checked');
                closeTaskCheckbox.trigger('click');
                self.lastSettings(checkboxes);
            }

            // checbox checked выполнения задачи
            closeTaskCheckbox.unbind('change');
            closeTaskCheckbox.bind('change', function () {
                // if checkked
                if (closeTaskCheckbox.hasClass('is-checked')) self.lastSettings(checkboxes);
                else {
                    // иначе удаляем созданные элементы
                    $('.subscribers__wrapper').remove();
                    $('.pipelines__wrapper').remove();

                    // обнуляем системную переменную
                    checkboxes.isChecked = false;
                    self.checkboxes = checkboxes;
                    self.saveSettings(self.checkboxes);
                }
            });
        }

        // функция проверки на число из настроек виджета, иначе 0
        this.closeTaskToNumber = function () {
            self.set_settings({ close_task: parseInt(self.get_settings().close_task) });
            if (!Number.isInteger(self.get_settings().close_task)) self.set_settings({ close_task: 0 });
            self.close_task_length = self.get_settings().close_task;
        }

        this.callbacks = {
            settings: function () {
                // преобразуем системную переменну в число и выводим в настройки
                self.closeTaskToNumber();
                $('input[name="close_task"]').val(self.close_task_length);

                // если виджет не установлен, обнуляем значение из настроек
                if (self.get_install_status() === 'not_configured') {
                    self.set_settings({ close_task: 0 });
                    self.close_task_length = null;
                    $('input[name="close_task"]').val(0);
                }

                // обязательность выполнения задачи
                self.addCheckboxSettings();
                // обнуляем системную переменную
                self.saveSettings(self.checkboxes);
            },
            init: function () {
                return true;
            },
            bind_actions: function () {
                // запускаем прослушку элементов
                self.observerCloseTasks.observe($('body')[0], {
                    childList: true,
                    subtree: true,
                    attributes: true
                });

                return true;
            },
            render: function () {
                // в случае перезагрузки страницы или изменения значения
                if (self.close_task_length === null) self.closeTaskToNumber();

                // template только для задач и карточек
                if (AMOCRM.getBaseEntity() === 'todo' || AMOCRM.isCard() === true) {
                    // сообщение об ошибке на кнопке закрытия задачи
                    self.getTemplate('close_error_message_tasks', {}, function (template) {
                        // добавляем элемент на страницу
                        var errorMessage = template.render();
                        if (!$('body .close_error_message_tasks').length) $('body').append(errorMessage);
                    });
                }

                return true;
            },
            dpSettings: function () {},
            advancedSettings: function () {},
            destroy: function () {
                // останавливаем прослушку элементов
                self.observerCloseTasks.disconnect();
            },
            contacts: {
                selected: function () {}
            },
            onSalesbotDesignerSave: function (handler_code, params) {},
            leads: {
                selected: function () {}
            },
            todo: {
                selected: function () {},
            },
            onSave: function () {
                // обнуляем для рендера
                self.close_task_length = null;
                return true;
            },
            onAddAsSource: function (pipeline_id) {}
        };
        return this;
    };
    return CustomWidget;
});