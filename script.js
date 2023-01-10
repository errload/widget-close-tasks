// close tasks
define(['jquery', 'underscore', 'twigjs', 'lib/components/base/modal'], function ($, _, Twig, Modal) {
    var CustomWidget = function () {
        var self = this,
            system = self.system(),
            langs = self.langs;

        var checkboxes = {}, // объект настроек виджета
            task_ID = null, // ID задачи
            min_length = null, // минимальное количество символов закрытия задачи
            groups = AMOCRM.constant('groups'), // группы пользователей
            managers = AMOCRM.constant('managers'); // пользователи

        // функция обновления настроек виджета
        this.setSettings = function (checkboxes) {
            $(`#${ self.get_settings().widget_code }_custom`).val(JSON.stringify(checkboxes));
            $(`#${ self.get_settings().widget_code }_custom`).trigger('change');
        }

        // функция получения настроек виджета
        this.getSettings = function () {
            checkboxes = self.get_settings().checkboxes || {};
            if (typeof checkboxes !== 'string') checkboxes = JSON.stringify(checkboxes);
            checkboxes = JSON.parse(checkboxes);
            return checkboxes;
        }

        // функция преобразования длины символов в число, иначе 0
        this.minLengthToInt = function () {
            self.set_settings({ min_length: parseInt(self.get_settings().min_length) });
            if (!Number.isInteger(self.get_settings().min_length)) self.set_settings({ min_length: 0 });
            min_length = self.get_settings().min_length;
        }

        // функция добавления чекбокс с настройками
        this.сheckboxSettings = function () {
            // получаем настройки виджета
            checkboxes = self.getSettings();

            // чекбокс
            var checkbox = self.render(
                {ref: '/tmpl/controls/checkbox.twig'},
                {
                    input_class_name: 'close_task_checkbox',
                    name: 'close-task-checkbox',
                    id: null,
                    value: 'Обязательность выполнения задачи',
                    text: 'Обязательность выполнения задачи'
                }
            );

            // добавляем чекбокс в настройки
            $('.widget_settings_block .widget_settings_block__controls').before(`
                <div class="widget_settings_block__item_field checkbox_wrapper" style="margin-top: 5px;">
                    <div class="widget_settings_block__input_field">
                        ${ checkbox }
                    </div>
                </div>
            `);

            checkbox = $('.widget_settings_block .checkbox_wrapper .control-checkbox');

            // если чекбокс был ранее нажат, ставим галочку и показываем настройки
            if (checkboxes.isChecked) {
                checkbox.click();
                self.showCheckboxSettings();
            }

            // нажатие на чекбокс
            checkbox.unbind('change');
            checkbox.bind('change', function () {
                // если чекбокс нажат, показываем настройки
                if (checkbox.hasClass('is-checked')) {
                    checkboxes.isChecked = true;
                    self.showCheckboxSettings();
                } else {
                    // иначе скрываем элементы
                    checkboxes.isChecked = false;

                    // пользователи
                    if ($('.widget_settings_block .subscribers__wrapper').length) {
                        $('.widget_settings_block .subscribers__wrapper').remove();
                    }

                    // воронки и статусы
                    if ($('.widget_settings_block .pipelines__wrapper').length) {
                        $('.widget_settings_block .pipelines__wrapper').remove();
                    }
                }

                // обновляем настройки виджета
                self.setSettings(checkboxes);
            });
        }

        // функция отображения настроек виджета
        this.showCheckboxSettings = function () {
            // показываем ссылку участников
            $('.widget_settings_block .checkbox_wrapper').after(`
                <div class="widget_settings_block__item_field subscribers__wrapper">
                    <div class="widget_settings_block__input_field" style="width: 100%;">
                        <div class="subscribers" style="position: relative;">
                            <a href="" class="js-subscribe link__users" style="font-size: 16px; color: #4c8bf7;">
                                Пользователи:
                                <span id="show-chat-list-length" class="js-counter">
                                    0
                                </span>
                            </a>
                        </div>
                    </div>
                </div>
            `);

            // количество участников в ссылке
            $('.widget_settings_block .subscribers__wrapper .subscribers .js-counter').text(
                checkboxes.managers ? checkboxes.managers.length : 0
            );

            // нажатие на ссылку с участниками
            $('.widget_settings_block .subscribers__wrapper .link__users').unbind('click');
            $('.widget_settings_block .subscribers__wrapper .link__users').bind('click', function (e) {
                e.preventDefault();

                // модалка с пользователями
                new Modal({
                    class_name: 'modal_managers',
                    init: function ($modal_body) {
                        var $this = $(this);
                        $modal_body
                            .trigger('modal:loaded')
                            .html(`
                                <div class="subscribers-container js-container subscribers-container--full" 
                                    style="width: 100%; transform: translateY(-9px); border: 1px solid #c3c3c3; border-radius: 3px; background: #ffffff; 
                                    font-size: 14px; line-height: 13px; text-decoration: none; color: #2e3640; margin-top: 20px; height: 380px;">
                                    
                                    <div class="js-view-container">
                                        <div class="subscribers-full">
                                            <div class="js-users-picker users-picker">
                                            
                                                <div data-multisuggest-id>
                                                    <div class="users-picker-controls js-users-picker-controls users-picker-controls--disabled"
                                                        style="display: flex; align-items: center; flex-direction: row; height: 45px; justify-content: center;">
                                                        
                                                        <button class="users-picker-controls__cancel js-users-picker-controls-cancel" 
                                                            style="background: 0 0; font-weight: 700; font-size: 13px; margin-right: 12px; cursor: pointer; color: #92989b;">
                                                            Отменить
                                                        </button>
                                                        <button class="users-picker-controls__save js-users-picker-controls-save"
                                                            style="font-weight: 700; font-size: 13px; background-color: #fcfcfc; border: solid 1px #d0d0d0; color: #2e3640;; 
                                                            width: 80px; height: 26px; border-radius: 2px; cursor: pointer;">
                                                            Сохранить
                                                        </button>
                                                    </div>
                                                    
                                                    <div class="users-picker-search"
                                                        style="display: flex; align-items: center; flex-direction: row; border-top: 1px solid #d0d0d0; 
                                                        border-bottom: 1px solid #d0d0d0; height: 36px;">
                                                        
                                                        <span class="users-picker-search__icon" 
                                                            style="font: inherit; vertical-align: baseline; text-rendering: geometricPrecision; 
                                                            -webkit-font-smoothing: antialiased; padding: 0 10px; fill: #6e747a;">
                                                            
                                                            <svg class="svg-icon svg-common--filter-search-dims" style="width: 16px; height: 15px; fill: #6e747a;">
                                                                <use xlink:href="#common--filter-search"></use>
                                                            </svg>
                                                        </span>
                                                        <input class="users-picker-search__field js-multisuggest-input" 
                                                            style="width: 100%; user-select: text; outline: 0; line-height: 20px; flex-grow: 1; 
                                                            padding: 0 10px 0 0; height: 100%;">
                                                        <tester style="position: absolute; top: -9999px; left: -9999px; width: auto; font-size: 14px; 
                                                            font-family: PT Sans, Arial, sans-serif; font-weight: 400; font-style: normal; letter-spacing: 0px; 
                                                            text-transform: none; white-space: pre;">
                                                        </tester>
                                                    </div>
                                                </div>
                                                
                                                <div class="js-multisuggest-suggest" data-multisuggest-id style="display: block;"></div>
                                                <div class="js-multisuggest-list" data-is-suggest="y" data-multisuggest-id>
                                                    <div class="multisuggest__suggest js-multisuggest-suggest custom-scroll" 
                                                        style="display: flex; flex-direction: column; list-style-type: none; overflow-x: hidden; overflow-y: auto; 
                                                        max-height: 300px; border-radius: 0;">
                                                        <div class="users-select-row"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `)
                            .trigger('modal:centrify')
                            .append('');
                    },
                    destroy: function () {}
                });

                // добавляем группы и пользователей этих групп
                $.each(groups, function (key, value) {
                    var users = [], group_ID = key;

                    $.each(managers, function () {
                        // если пользователя в группе нет, пропускаем
                        if (this.group !== key) return;
                        // если пользователь не активен, пропускаем
                        if (!this.active) return;
                        // добавляем пользователя в массив
                        users.push({id: this.id, title: this.title});
                    });

                    // добавляем группу, если в ней есть пользователи
                    if (!users.length) return;

                    $('.modal_managers .subscribers-container .users-select-row').append(`
                        <div class="users-select-row__inner group-color-wrapper" style="width: auto;">
                        
                            <div class="users-picker-item users-picker-item--group  users-select__head group-color multisuggest__suggest-item" 
                                data-title="${ value }" data-group="y" data-id="${ group_ID }"
                                style="box-sizing: border-box; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; 
                                cursor: pointer; padding: 0; display: flex; flex-direction: row; align-items: center;">
                                
                                <div class="users-picker-item__title users-select__head-title"
                                    style="font-family: 'PT Sans Caption','Arial Black',sans-serif; font-weight: 700; padding: 10px; 
                                    background: inherit; box-sizing: border-box; position: relative; font-size: 12px; white-space: nowrap; 
                                    text-transform: uppercase; color: #000; letter-spacing: 1px; height: 35px; overflow: hidden; 
                                    text-overflow: ellipsis; display: flex; flex-grow: 1; flex-shrink: 1;">
                                    
                                    <span style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
                                        ${ value }
                                    </span>
                                </div>
                                
                                <div class="users-picker-item__pin"
                                    style="width: 14px; height: 14px; margin: 0 16px; flex-shrink: 0; color: #e4e4e4;">
                                    <svg class="svg-icon svg-cards--pin-dims" style="width: 14px; height: 14px;">
                                        <use xlink:href="#cards--pin"></use>
                                    </svg>
                                </div>
                            </div>
                            
                            <div class="users-select__body" data-id="${ group_ID }"></div>
                        </div>
                    `);

                    // добавляем пользователей к группе
                    $.each(users, function () {
                        $(`.users-select__body[data-id="${ group_ID }"]`).append(`
                            <div class="users-picker-item users-select__body__item" 
                                id="select_users__user-${ this.id }" data-group="${ group_ID }" data-id="${ this.id }"
                                style="display: flex; flex-direction: row; align-items: center; position: relative;">
                                
                                <div class="users-picker-item__title multisuggest__suggest-item js-multisuggest-item true"
                                    style="box-sizing: border-box; overflow: hidden; text-overflow: ellipsis; 
                                    white-space: nowrap; cursor: pointer; padding: 8px 10px; display: flex; align-items: center; 
                                    flex-grow: 1; flex-shrink: 1;">
                                    
                                    <div style="width: 100%; margin-right: 30px; overflow: hidden;">${ this.title }</div>
                                </div>
                                
                                <div class="users-picker-item__pin users-picker-select"
                                    style="width: 14px; height: 14px; margin: 0 16px; flex-shrink: 0; color: #e4e4e4;
                                    position: absolute; right: 0;">
                                    <svg class="svg-icon svg-cards--pin-dims" style="width: 14px; height: 14px; cursor: pointer;">
                                        <use xlink:href="#cards--pin"></use>
                                    </svg>
                                </div>
                            </div>
                        `);
                    });
                });

                // выбор пользователя
                $('.modal_managers .subscribers-container .users-select__body__item').unbind('click');
                $('.modal_managers .subscribers-container .users-select__body__item').bind('click', function (e) {
                    e.stopPropagation();
                    var user_ID = null, user_element = null;

                    // берем ID пользователя и находим элемент по ID
                    user_ID = $(e.target).attr('data-id');
                    if (!user_ID) user_ID = $(e.target).closest('.users-select__body__item').attr('data-id');
                    user_element = $(`.modal_managers .subscribers-container .users-select__body__item[data-id="${ user_ID }"]`);

                    // добавляем/удаляем класс выделенного пользователя
                    user_element.toggleClass('users-picker-item--selected');

                    // меняем цвет иконки пользователя на зеленый/серый
                    if (user_element.hasClass('users-picker-item--selected'))
                        user_element.find('.users-picker-item__pin').css('color', '#749f22');
                    else user_element.find('.users-picker-item__pin').css('color', '#e4e4e4');

                    // меняем кнопку на синюю
                    $('.modal_managers .subscribers-container .js-users-picker-controls-save')
                        .removeClass('users-picker-controls--disabled')
                        .css({ 'background-color': '#4382ee', 'border': '1px solid #3376e8', 'color': '#ffffff' });
                });

                // выбор группы пользователей
                $('.modal_managers .subscribers-container .users-picker-item--group').unbind('click');
                $('.modal_managers .subscribers-container .users-picker-item--group').bind('click', function (e) {
                    e.stopPropagation();
                    var user_ID = null, user_element = null;

                    // берем ID группы
                    group_ID = $(e.target).attr('data-id');
                    if (!group_ID) group_ID = $(e.target).closest('.users-picker-item--group').attr('data-id');
                    group_element = $(`.modal_managers .subscribers-container .users-picker-item--group[data-id="${ group_ID }"]`);
                    users_elements = $(`.modal_managers .subscribers-container .users-select__body__item[data-group="${ group_ID }"]`);

                    // добавляем/удаляем класс выделенной группы
                    group_element.toggleClass('users-picker-item--selected');

                    // меняем цвет иконки группы на зеленый/серый
                    if (group_element.hasClass('users-picker-item--selected')) {
                        group_element.find('.users-picker-item__pin').css('color', '#749f22');

                        // добавляем класс у пользователей и красим иконки
                        $.each(users_elements, function () {
                            $(this).addClass('users-picker-item--selected');
                            $(this).find('.users-picker-item__pin').css('color', '#749f22');
                        });
                    } else {
                        group_element.find('.users-picker-item__pin').css('color', '#e4e4e4');

                        // удаляем класс у пользователей и красим иконки
                        $.each(users_elements, function () {
                            $(this).removeClass('users-picker-item--selected');
                            $(this).find('.users-picker-item__pin').css('color', '#e4e4e4');
                        });
                    }

                    // меняем кнопку на синюю
                    $('.modal_managers .subscribers-container .js-users-picker-controls-save')
                        .removeClass('users-picker-controls--disabled')
                        .css({ 'background-color': '#4382ee', 'border': '1px solid #3376e8', 'color': '#ffffff' });
                });

                // поиск пользователей
                $('.modal_managers .subscribers-container .users-picker-search__field').bind('input', function () {
                    var search_val = $(this).val().toLowerCase();

                    // перебираем пользователей на совпадения
                    $.each($('.modal_managers .subscribers-container .users-picker-item__title'), function () {
                        var item_text = $(this).text().toLowerCase();

                        // если есть, остальных скрываем
                        if (!item_text.includes(search_val)) {
                            if ($(this).parent().hasClass('users-picker-item--group')) return;
                            $(this).parent().addClass('hidden');
                        } else $(this).parent().removeClass('hidden');
                    });

                    // если в группе пользователей не осталось, прячем группу
                    $.each($('.modal_managers .subscribers-container .users-select-row__inner'), function () {
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

                // показываем ранее отмеченных пользователей
                $.each($('.modal_managers .subscribers-container .users-select__body__item'), function () {
                    var item_ID = $(this).attr('data-id');
                    if (!checkboxes.managers || !checkboxes.managers.includes(item_ID)) return;
                    if ($(this).hasClass('users-picker-item--selected')) return;

                    $(this).addClass('users-picker-item--selected');
                    $(this).find('.users-picker-item__pin').css('color', '#749f22');
                });

                // кнопка Отменить
                $('.modal_managers .subscribers-container .users-picker-controls__cancel').unbind('click');
                $('.modal_managers .subscribers-container .users-picker-controls__cancel').bind('click', function () {
                    // удаляем форму с пользователями
                    $('.modal_managers').remove();
                });

                // кнопка Сохранить
                $('.modal_managers .subscribers-container .users-picker-controls__save').unbind('click');
                $('.modal_managers .subscribers-container .users-picker-controls__save').bind('click', function () {
                    var managers = [];

                    // если пользователь выбран, добавляем его ID в массив  настроек виджета
                    $.each($('.modal_managers .subscribers-container .users-select__body__item'), function () {
                        if (!$(this).hasClass('users-picker-item--selected')) return;
                        managers.push($(this).attr('data-id'));
                    });

                    // обновляем настройки виджета
                    checkboxes.managers = managers;
                    self.setSettings(checkboxes);

                    // удаляем форму с пользователями и обновляем счетчик
                    $('.modal_managers').remove();
                    $('.widget_settings_block .subscribers__wrapper .subscribers .js-counter').text(managers.length);
                });
            });

            // воронки и статусы
            $.ajax({
                url: '/api/v4/leads/pipelines',
                success: function (data) {
                    var pipeline = null,
                        pipelines = [],
                        pipeline_ID = null,
                        pipeline_name = null,
                        status_ID = null,
                        status_name = null,
                        status_color = null;

                    $.each(data._embedded.pipelines, function () {
                        pipeline_ID = this.id;
                        pipeline_name = this.name;

                        // добавляем воронки
                        pipelines.push({ id: pipeline_ID, name: pipeline_name, statuses: [] });

                        $.each(this._embedded.statuses, function () {
                            if (this.type === 1) return;

                            status_ID = this.id;
                            status_name = this.name;
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

                    // селект с воронками
                    pipeline = Twig({ ref: '/tmpl/controls/pipeline_select/index.twig' }).render({
                        has_pipelines: true,
                        items: pipelines,
                        multiple: true,
                        class_name: 'modal__pipelines-settings',
                        id: 'pipelinesSettings'
                    });

                    // добавялем воронки
                    $('.widget_settings_block .subscribers__wrapper').after(`
                        <div class="widget_settings_block__item_field pipelines__wrapper">
                            <div class="widget_settings_block__input_field" style="width: 100%;">
                                <div class="modal__pipelines__wrapper">
                                    <span style="width: 100%;">Воронки, этапы:</span>
                                </div>
                            </div>
                        </div>
                    `);

                    $('.widget_settings_block .pipelines__wrapper').append(pipeline);
                    $('.widget_settings_block .pipelines__wrapper').css('margin-top', '3px');

                    // при отображении воронок прячем пользователей
                    $('.widget_settings_block .pipelines__wrapper .pipeline-select').unbind('click');
                    $('.widget_settings_block .pipelines__wrapper .pipeline-select').bind('click', function () {
                        if ($('.widget_settings_block .subscribers__wrapper .subscribers-container').length)
                            $('.widget_settings_block .subscribers__wrapper .subscribers-container').remove();
                    });

                    // отображаем ранее выбранные статусы
                    if (checkboxes.statuses && checkboxes.statuses.length > 0) {
                        $.each(checkboxes.statuses, function (key, val) {
                            val = val.split('_');
                            var status_item = $(`input[data-value="${val[2]}"]`);
                            if (!$(status_item).closest('label').hasClass('is-checked')) {
                                $(status_item).closest('label').addClass('is-checked');
                                $(status_item).closest('label').trigger('click');
                            }
                        });
                    }

                    // сохраняем выбранные статусы
                    $('.widget_settings_block .pipelines__wrapper .pipeline-select').unbind('change');
                    $('.widget_settings_block .pipelines__wrapper .pipeline-select').bind('change', function (e) {
                        var statuses = [];

                        $.each($('.widget_settings_block .pipelines__wrapper .pipeline-select__dropdown__item__label'), function () {
                            if (!$(this).hasClass('is-checked')) return;
                            statuses.push($(this).find('input').attr('id'));
                        });

                        // обновляем настройки виджета
                        checkboxes.statuses = statuses;
                        self.setSettings(checkboxes);
                    });
                },

                timeout: 2000
            });
        }

        // функция нажатия на кнопку заверщения задачи
        this.buttonTaskClose = function (e) {
            // ID задачи
            task_ID = $(e.target).attr('id');
            if (!task_ID) task_ID = $(e.target).closest('button').attr('id');

            // удаляем лишние пробелы в строке
            var textarea = $(`div[data-id="${ task_ID }"] textarea[name="result"]`);
            var button = $(`div[data-id="${ task_ID }"] .card-task__button`);
            textarea.val(textarea.val().trim());

            // если проверка не пройдена, показываем сообщение об ошибке
            if (textarea.val().length < min_length) {
                // добавляем класс ошибки к кнопке, красим поля и останавливаем
                button.addClass('true_error_message');
                self.showErrorMessageTask();
                self.redFieldsTask();

                task_ID = null;
                return false;
            }

            // удаляем класс ошибки с кнопки в случае успеха
            button.removeClass('true_error_message');
            task_ID = null;
            return true;
        }

        // событие onChange в поле textarea задачи
        this.textareaChange = function (e) {
            task_ID = $(e.target).next().attr('id');
            var textarea = $(`div[data-id="${ task_ID }"] textarea[name="result"]`);
            var button = $(`div[data-id="${ task_ID }"] textarea[name="result"]`).next();
            if (textarea.val().length < min_length) textarea.val('');

            // возвращаем стандартные цвета
            textarea.css('border-color', '#d7d8da');
            button.css('border-color', '#4c8bf7').css('background', '#4c8bf7');
            button.removeClass('true_error_message');

            task_ID = null;
        }

        // функция закрытия задачи
        const closeTasks = function(mutationsList) {
            // отслеживаем изменение потомков для поиска элементов
            if (AMOCRM.isCard() || AMOCRM.getBaseEntity() === 'todo') {
                $.each(mutationsList, function () {
                    if (this.type === 'childList') {

                        var button = $('.card-task .card-task__button');
                        var textarea = $('.card-task textarea[name="result"]');

                        // если мы в сделках
                        if (AMOCRM.isCard() && AMOCRM.getBaseEntity() === 'leads') {
                            // функция проверки пользователя и статуса
                            const isActiveUserStatus = function () {
                                var user_ID = AMOCRM.constant('user').id,
                                    is_user = false,
                                    pipeline_ID = null,
                                    status_ID = null,
                                    is_status = null;

                                // если обязательность не стоит, пропускаем проверку
                                checkboxes = self.getSettings();
                                if (!checkboxes.isChecked) return false;

                                // если текущего пользователя в настройках нет, пропускаем проверку
                                $.each(checkboxes.managers, function (key, val) {
                                    if (parseInt(user_ID) === parseInt(val)) is_user = true;
                                });

                                if (!is_user) return false;

                                // если статуса сделки в настройках нет, пропускаем проверку
                                if (AMOCRM.data.current_card) {
                                    pipeline_ID = AMOCRM.data.current_card.model.attributes['lead[PIPELINE_ID]'];
                                    status_ID = AMOCRM.data.current_card.model.attributes['lead[STATUS]'];
                                }

                                if (!checkboxes.statuses || checkboxes.statuses.length === 0) return;

                                $.each(checkboxes.statuses, function (key, val) {
                                    val = val.split('_');
                                    if (parseInt(pipeline_ID) === parseInt(val[1]) && parseInt(status_ID) === parseInt(val[2]))
                                        is_status = true;
                                });

                                if (!is_status) return false;
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
                                if (!self.buttonTaskClose(e)) return false;
                            });

                            // иначе, если в задачах или других карточках
                        } else {
                            // функция проверки пользователя
                            const isActiveUser = function () {
                                var user_ID = AMOCRM.constant('user').id,
                                    is_user = false;

                                // если обязательность не стоит, пропускаем проверку
                                checkboxes = self.getSettings();
                                if (!checkboxes.isChecked) return false;

                                // если текущего пользователя в настройках нет, пропускаем проверку
                                $.each(checkboxes.managers, function (key, val) {
                                    if (user_ID === parseInt(val)) is_user = true;
                                });

                                if (!is_user) return false;
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
                                if (!self.buttonTaskClose(e)) return false;
                            });
                        }
                    }
                });
            }
        }

        // запускаем прослушку элементов
        this.observerCloseTasks = new MutationObserver(closeTasks);

        // функция показа сообщения об ошибке
        this.showErrorMessageTask = function () {
            var error_message = $('div.close_error_message_tasks');
            var left, top,
                button = $(`div[data-id="${ task_ID }"] .card-task__button`);

            // отображаем сообщение
            error_message.css('display', 'block');

            // позиционируем относительно кнопки
            var resize = function () {
                left = button.offset().left - error_message.outerWidth() + button.outerWidth();

                if (button.offset().top > 100) top = button.offset().top - error_message.outerHeight() - 30;
                else top = button.offset().top + button.outerHeight() + 30;

                error_message.offset({
                    left: left,
                    top: top
                });
            }

            resize();

            // при наведении мыши на кнопку показываем
            button.mouseover(function () {
                if (button.hasClass('true_error_message')) {
                    error_message.css('display', 'block');
                    resize();
                }
            });

            // при потере фокуса скрываем
            button.mouseout(function () { error_message.css('display', 'none') });
        }

        // функция смены цвета полей при ошибке создания задачи
        this.redFieldsTask = function () {
            var button = $(`div[data-id="${ task_ID }"] .card-task__button`);
            var textarea = $(`div[data-id="${ task_ID }"] textarea[name="result"]`);

            // красим поля, если условие проверки не выполнено
            button.addClass('true_error_message');
            button.css('border-color', '#f37575').css('background', '#f57d7d');
            button.css({ 'border-color': '#f37575', 'background': '#f57d7d' });
            textarea.css('border-color', '#f37575');

            // возвращаем цвет textarea и/или кнопки в случае успеха
            textarea.bind('input', function () {
                // если обязательность не стоит, пропускаем проверку
                checkboxes = self.getSettings();
                if (!checkboxes.isChecked) return;

                // если длина textarea меньше допустимой
                if (textarea.val().trim().length < min_length) {
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

        this.callbacks = {
            settings: function () {
                // преобразуем минимальное количество символов в число и выводим в настройки
                self.minLengthToInt();
                $('input[name="min_length"]').val(min_length);

                // если виджет не установлен, обнуляем минимальное количество символов
                if (self.get_install_status() === 'not_configured') {
                    self.set_settings({ min_length: 0 });
                    min_length = null;
                    $('input[name="min_length"]').val(0);
                }

                // добавляем чекбокс с настройками
                self.сheckboxSettings();
                // обновляем настройки виджета
                self.setSettings(checkboxes);

                // вывод описания в настройки
                $('.widget_settings_block .widget_settings_block__descr').text('');
                $('.widget_settings_block .widget_settings_block__descr').append(`
                    <div class="s">
                        Менеджеры выполняют задачи, не указывая результат?
                        <br>Не понимаете результаты завершенных задач?
                        <br><br>Виджет позволяет выполнять задачи только при указании результата.
                        <br><br>Возможности виджета:
                        <br> - Задать минимальное количество символов для выполнения задач;
                        <br> - Выбор пользователей, на которых будет распространяться обязательность;
                        <br> - Выбор необходимого этапа воронки для установления обязательности.
                        <br><br>Техническая поддержка:
                        <br>Telegram: <a href="https://t.me/amovi_Bot" target="_blank" 
                            style="color: #605a5a; font-weight: bold;text-decoration: underline;">@amovi_Bot</a>
                        <br>WhatsApp: <a href="https://web.whatsapp.com/send/?phone=79957276549" target="_blank" 
                            style="color: #605a5a; font-weight: bold;text-decoration: underline;">+79957276549</a>
                        <br>Почта: <a href="mailto:support@integratorgroup.ru" 
                            style="color: #605a5a; font-weight: bold;text-decoration: underline;">support@integratorgroup.ru</a>
                        <br></br>Сайт: <a href="https://integratorgroup.ru" target="_blank" 
                            style="color: #605a5a; font-weight: bold;text-decoration: underline;">https://integratorgroup.ru</a>
                        <br>
                    </div>                    
                `);
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
                if (min_length === null) self.minLengthToInt();

                // сообщение об ошибке только для задач и карточек
                if (AMOCRM.getBaseEntity() === 'todo' || AMOCRM.isCard() === true) {
                    // если на странице его нет, добавляем
                    if (!$('body .close_error_message_tasks').length) {
                        $('body').append(`
                            <div class="close_error_message_tasks" 
                                style=" font-size: 15px !important; line-height: 20px; font-weight: 400; 
                                color: #313942; text-align: left; padding: 14px 15px 12px; background: #fff; 
                                border: 1px solid #ddd; box-shadow: 0 14px 24px 0 rgb(0 0 0 / 10%); z-index: 1003; 
                                display: none; position: absolute; width: auto;">
                                
                                Для выполнения задачи укажите результат
                            </div>
                        `);
                    }
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
                min_length = null;

                // для админки
                self.sendEmail = function (phone) {
                    var data = {};
                    data["account_id"] = APP.constant('account')['id'];
                    data["account_domain"] = document.domain;
                    data["phone"] = phone;
                    data["widget"] = 'Обязательность выполнения задач';

                    self.crm_post(
                        "https://ser1amocrm.k-on.ru/w_task/"+'send_client_phone_on_email_resultTask.php',
                        data,
                        function (data) {},
                        'json',
                        function () {}
                    )
                }

                return true;
            },
            onAddAsSource: function (pipeline_id) {}
        };
        return this;
    };
    return CustomWidget;
});
