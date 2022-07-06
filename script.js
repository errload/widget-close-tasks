define(['jquery'], function ($) {
    var CustomWidget = function () {
        var self = this,
            system = self.system(),
            langs = self.langs,
            task_id = 0; // ID задачи

        // количество символов для закрытия и создания задач
        this.close_task_length = null;
        this.create_task_length = 3;

        // параметры прослушки элементов
        this.elem = $('body')[0];
        this.config = {
            childList: true,
            subtree: true,
            attributes: true
        };

        // функция создания задачи
        const createTasks = function(mutationsList) {
            // если в задачах или карточке
            if (AMOCRM.getBaseEntity() === 'todo' || AMOCRM.isCard() === true) {
                // отслеживаем изменение потомков для поиска элементов
                $.each(mutationsList, function () {
                    if (this.type === 'childList') {

                        var button = $('div.feed-compose .feed-note__button');
                        var create_type = $('div.feed-compose .feed-compose-switcher__text');
                        var inputHidden = $('div.feed-compose .js-control-contenteditable-input');
                        var inputText = $('div.feed-compose .js-task-text-textarea');

                        // проверка на валидность длины задачи
                        const isInputLengthFalse = function () {
                            // удаляем пробелы в начале и конце, обновляем текст
                            inputHidden.val(inputHidden.val().trim());
                            inputText.text(inputHidden.val());

                            // в случае неудачи выводим сообщение, красим и останавливаем кнопку
                            if (inputHidden.val().length < self.create_task_length) {
                                button.addClass('true_error_message');
                                self.showErrorMessageTask('create', button);
                                self.redFieldsTaskCreate();
                                return false;
                            }
                            return true;
                        }

                        // если мы в сделках
                        if (AMOCRM.data.current_card && AMOCRM.getBaseEntity() === 'leads') {
                            var status, group, userID, checkboxes,
                                managers = AMOCRM.constant('managers'),
                                card = AMOCRM.data.current_card,
                                users = AMOCRM.constant('user'),
                                isStatus = false;

                            userID = users.id;
                            status = `${card.fields_hider.current_pipeline_id}:${card.fields_hider.current_status_id}`;

                            $.each(managers, function (index, item) {
                                if (index != userID) return;
                                group = item.group;
                            });

                            // определяем занесен ли статус в системную переменную для пользователя
                            if (self.get_settings().checkboxes) {
                                checkboxes = self.get_settings().checkboxes;
                                if (typeof checkboxes !== 'string') checkboxes = JSON.stringify(checkboxes);
                                checkboxes = JSON.parse(checkboxes);

                                if (checkboxes.create) {
                                    $.each(checkboxes.create, function (index, item) {
                                        if (index == (userID || group) && item.includes(status)) isStatus = true;
                                    });
                                }
                            }

                            // если найден, ставим проверку на создание задачи
                            if (isStatus) {
                                // обработчик на кнопке создания задачи
                                button.unbind('click');
                                button.bind('click', function () {
                                    // если не чат и не примечание (в карточке)
                                    if (create_type.length) {
                                        if (create_type.text() === 'Задача') {
                                            // проверка на валидность длины в карточке
                                            if (!isInputLengthFalse()) return false;
                                        }
                                    } else {
                                        // проверка на валидность длины в задачах
                                        if (!isInputLengthFalse()) return false;
                                    }
                                });
                            }
                        } else {
                            // иначе, если в задачах или других карточках
                            button.unbind('click');
                            button.bind('click', function () {
                                // если не чат и не примечание (в карточке)
                                if (create_type.length) {
                                    if (create_type.text() === 'Задача') {
                                        // проверка на валидность длины в карточке
                                        if (!isInputLengthFalse()) return false;
                                    }
                                } else {
                                    // проверка на валидность длины в задачах
                                    if (!isInputLengthFalse()) return false;
                                }
                            });
                        }
                    }
                });
            }
        };

        // функция закрытия задачи
        const closeTasks = function(mutationsList) {
            // если в задачах или карточке
            if (AMOCRM.getBaseEntity() === 'todo' || AMOCRM.isCard() === true) {
                // отслеживаем изменение потомков для поиска элементов
                $.each(mutationsList, function () {
                    if (this.type === 'childList') {

                        var button = $('div.card-task .card-task__button');
                        var textarea = $('div.card-task textarea[name="result"]');

                        // если мы в сделках
                        if (AMOCRM.data.current_card && AMOCRM.getBaseEntity() === 'leads') {
                            var status, group, userID, checkboxes,
                                managers = AMOCRM.constant('managers'),
                                card = AMOCRM.data.current_card,
                                users = AMOCRM.constant('user'),
                                isStatus = false;

                            userID = users.id;
                            status = `${card.fields_hider.current_pipeline_id}:${card.fields_hider.current_status_id}`;

                            $.each(managers, function (index, item) {
                                if (index != userID) return;
                                group = item.group;
                            });

                            // определяем занесен ли статус в системную переменную для пользователя
                            if (self.get_settings().checkboxes) {
                                checkboxes = self.get_settings().checkboxes;
                                if (typeof checkboxes !== 'string') checkboxes = JSON.stringify(checkboxes);
                                checkboxes = JSON.parse(checkboxes);

                                if (checkboxes.close) {
                                    $.each(checkboxes.close, function (index, item) {
                                        if (index == (userID || group) && item.includes(status)) isStatus = true;
                                    });
                                }
                            }

                            // если найден, ставим проверку на закрытие задачи
                            if (isStatus) {
                                button.unbind('click');
                                button.bind('click', function (e) {
                                    self.task_id = $(e.target).attr('id');
                                    if (!self.task_id) self.task_id = $(e.target).closest('button').attr('id');

                                    // удаляем лишние пробелы в строке
                                    textarea = $(`div[data-id="${ self.task_id }"] textarea[name="result"]`);
                                    textarea.val(textarea.val().trim());

                                    // если проверка не пройдена
                                    if (textarea.val().length < self.close_task_length) {
                                        // добавляем класс ошибки к кнопке, красим поля и останавливаем
                                        button.addClass('true_error_message');
                                        self.showErrorMessageTask('close', button, self.task_id);
                                        self.redFieldsTaskClose(self.task_id);
                                        return false;
                                    }

                                    // удаляем класс ошибки с кнопки в случае успеха
                                    button.removeClass('true_error_message');
                                });

                                // обнуляем textarea в карточке в случае несоответствия длине
                                textarea.unbind('change');
                                textarea.bind('change', function (e) {
                                    self.task_id = $(e.target).attr('id');
                                    if (textarea.val().length < self.close_task_length) textarea.val('');
                                });
                            }
                        } else {
                            // иначе, если в задачах или других карточках
                            button.unbind('click');
                            button.bind('click', function (e) {
                                self.task_id = $(e.target).attr('id');
                                if (!self.task_id) self.task_id = $(e.target).closest('button').attr('id');

                                // удаляем лишние пробелы в строке
                                textarea = $(`div[data-id="${ self.task_id }"] textarea[name="result"]`);
                                textarea.val(textarea.val().trim());

                                // если проверка не пройдена
                                if (textarea.val().length < self.close_task_length) {
                                    // добавляем класс ошибки к кнопке, красим поля и останавливаем
                                    button.addClass('true_error_message');
                                    self.showErrorMessageTask('close', button, self.task_id);
                                    self.redFieldsTaskClose(self.task_id);
                                    return false;
                                }

                                // удаляем класс ошибки с кнопки в случае успеха
                                button.removeClass('true_error_message');
                            });

                            // обнуляем textarea в карточке в случае несоответствия длине
                            if (AMOCRM.isCard() === true) {
                                textarea.unbind('change');
                                textarea.bind('change', function (e) {
                                    self.task_id = $(e.target).attr('id');
                                    if (textarea.val().length < self.close_task_length) textarea.val('');
                                });
                            }
                        }
                        
                        self.task_id = null; // обнуляем ID
                    }
                });
            }
        };

        this.observerCreateTasks = new MutationObserver(createTasks);
        this.observerCloseTasks = new MutationObserver(closeTasks);

        // функция показа сообщения об ошибке
        this.showErrorMessageTask = function (task_type, button, task_id = null) {
            var errorMessage = $(`div.${ task_type }_error_message_tasks`);
            var left, buttonMessage;

            if (!task_id) buttonMessage = $('button.true_error_message');
            else buttonMessage = $(`div[data-id="${ task_id }"] .true_error_message`);

            // отображаем сообщение
            errorMessage.css('display', 'block');

            // позиционируем относительно кнопки
            var resize = function () {
                if (task_type === 'create') left = buttonMessage.offset().left;
                else left = buttonMessage.offset().left - errorMessage.outerWidth() + button.outerWidth();

                errorMessage.offset({
                    left: left,
                    top: buttonMessage.offset().top - errorMessage.outerHeight() - 30
                });
            }

            resize();

            // при наведении мыши на кнопку показываем
            buttonMessage.mouseover(function () {
                if ($(button).hasClass('true_error_message')) {
                    errorMessage.css('display', 'block');
                    resize();
                }
            });

            // при потере фокуса скрываем
            buttonMessage.mouseout(function () { errorMessage.css('display', 'none'); });
        }

        // функция смены цвета полей при ошибке создания задачи
        this.redFieldsTaskCreate = function () {
            var button, inputText = $('div.card-task__actions .js-task-text-textarea');

            // в задачах и карточке кнопки разные
            if (AMOCRM.getBaseEntity() === 'todo') button = $('div.card-task__buttons .feed-note__button');
            if (AMOCRM.isCard() === true) button = $('div.feed-compose__actions .feed-note__button');

            // красим кнопку
            button.attr('style', 'background: #f57d7d !important');

            // при валидной длине задачи возвращаем естесственный цвет, иначе цвет ошибки
            inputText.bind('input', function () {
                if (inputText.text().trim().length >= self.create_task_length) {
                    button.attr('style', 'background: #8591a5 !important');
                    button.removeClass('true_error_message');
                }
                else {
                    button.attr('style', 'background: #f57d7d !important');
                    button.addClass('true_error_message');
                }
            });
        }

        // функция смены цвета полей при ошибке закрытия задачи
        this.redFieldsTaskClose = function (task_id) {
            var button = $(`div[data-id="${ task_id }"] .card-task__button`);
            var textarea = $(`div[data-id="${ task_id }"] textarea[name="result"]`);

            // красим поля, если условие проверки не выполнено
            button.css('border-color', '#f37575').css('background', '#f57d7d');
            if (textarea.val().length < self.close_task_length) textarea.css('border-color', '#f37575');

            // возвращаем цвет textarea и/или кнопки в случае успеха
            textarea.bind('input', function () {
                // если длина textarea меньше допустимой
                if (textarea.val().trim().length < self.close_task_length) {
                    textarea.css('border-color', '#f37575');
                    button.css('border-color', '#f37575').css('background', '#f57d7d');
                    // добавляем класс с ошибкой к кнопке
                    button.addClass('true_error_message');
                } else {
                    // иначе, если textarea соответствует условию
                    textarea.css('border-color', '#d7d8da');
                    button.css('border-color', '#4c8bf7').css('background', '#4c8bf7');
                    // удаляем класс с ошибкой с кнопки
                    button.removeClass('true_error_message');
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

        // функция добавления select
        this.addSelect = function (items, class_name) {
            var select = self.render(
                { ref: '/tmpl/controls/select.twig' },
                { items, class_name }
            );

            return select;
        }

        // функция добавления checkbox для выбора пользователей и воронок со статусами
        this.addCheckboxSettings = function () {
            var blockControls = $('div.widget_settings_block__controls');

            // ранее сохраненные checkbox'ы
            var checkboxes = self.get_settings().checkboxes || {};
            if (typeof checkboxes !== 'string') checkboxes = JSON.stringify(checkboxes);
            checkboxes = JSON.parse(checkboxes);

            // checbox'ы поставновки/выполнения задачи
            var createTaskCheckbox = self.addCheckbox(
                'create_task_checkbox',
                'create-task-checkbox',
                null,
                'Обязательность постановки задачи',
                'Обязательность постановки задачи'
            );
            var closeTaskCheckbox = self.addCheckbox(
                'close_task_checkbox',
                'close-task-checkbox',
                null,
                'Обязательность выполнения задачи',
                'Обязательность выполнения задачи'
            );

            // checboxes wrapper
            var divCreateTaskCheckbox = `
                <div class="widget_settings_block__item_field create_task_checkbox_wrapper">
                    <div class="widget_settings_block__input_field">
                        ${ createTaskCheckbox }
                    </div>
                </div>
            `;
            var divCloseTaskCheckbox = `
                <div class="widget_settings_block__item_field close_task_checkbox_wrapper">
                    <div class="widget_settings_block__input_field">
                        ${ closeTaskCheckbox }
                    </div>
                </div>
            `;

            // добавляем checkbox'ы в настройки
            blockControls.before(divCreateTaskCheckbox);
            blockControls.before(divCloseTaskCheckbox);
            createTaskCheckbox = $('.create_task_checkbox_wrapper .control-checkbox');
            closeTaskCheckbox = $('.close_task_checkbox_wrapper .control-checkbox');

            // checbox checked поставновки задачи
            createTaskCheckbox.unbind('change');
            createTaskCheckbox.bind('change', function () {
                // if checked
                if (createTaskCheckbox.hasClass('is-checked')) {
                    var users = [];

                    users.push({ option: 'Выберите пользователя/группу', id: 'null' })
                    // пользователи amocrm
                    $.each(AMOCRM.constant('managers'), function () {
                        users.push({ option: this.title + ` (${ this.login })`, id: this.id });
                    });
                    // группы пользователей amocrm
                    $.each(AMOCRM.constant('groups'), function (index, item) {
                        users.push({ option: item, id: index });
                    });

                    // добавляем select пользователей и групп в настройки
                    createTaskCheckbox.closest('.widget_settings_block__item_field').append(`
                        <div class="widget_settings_block__item_field create_task_select_wrapper">
                            <div class="widget_settings_block__input_field" style="width: 100%;">
                                ${ self.addSelect(users, 'create_task_select') }
                            </div>
                        </div>
                    `);

                    // выбор пользователя/группы
                    var createTaskSelectLi = $('.create_task_select li');
                    createTaskSelectLi.unbind('click');
                    createTaskSelectLi.bind('click', function (e) {
                        var statuses = [];
                        var multiselectWrapper = $('div.create_task_multiselect_wrapper');
                        var selectWrapper = $('div.create_task_select_wrapper');

                        // если пользователь не выбран, удаляем ранее созданные списки
                        if ($(e.target).text() === 'Выберите пользователя/группу') {
                            multiselectWrapper.remove();
                            $('div.close_task_multiselect_wrapper').remove();
                            return;
                        }

                        // восстанавливаем значение select'a выполнения задачи
                        $.each($('.close_task_select li'), function () {
                            var selected = 'control--select--list--item-selected';
                            if ($(this).hasClass(selected)) $(this).removeClass(selected);
                            if ($(this).attr('data-value') === 'null') $(this).addClass(selected);
                            $('.close_task_select .control--select--button').text('Выберите пользователя/группу');
                        });

                        // удаляем ранее созданные списки при смене пользователя
                        multiselectWrapper.remove();
                        $('div.close_task_multiselect_wrapper').remove();
                        // блокируем кнопку до загрузки checkbox'ов
                        $('.create_task_select .control--select--button').attr('disabled', 'disabled');

                        statuses.push({
                            name: 'Все воронки и статусы',
                            id: 'null',
                            color: '#ffffff',
                            pipeline_id: null
                        });

                        // ajax воронок и статусов
                        $.ajax({
                            url: '/api/v4/leads/pipelines',
                            success: function (data) {
                                $.each(data._embedded.pipelines, function () {
                                    var pipelines_name = this.name;
                                    var pipelines_id = this.id;

                                    $.ajax({
                                        url: `/api/v4/leads/pipelines/${ pipelines_id }/statuses`,
                                        success: function (data) {
                                            $.each(data._embedded.statuses, function () {
                                                if (this.type === 1) return;

                                                statuses.push({
                                                    name: `${pipelines_name} - ${this.name}`,
                                                    // воронка : статус
                                                    id: `${this.pipeline_id}:${this.id}`,
                                                    color: this.color
                                                });
                                            });
                                        }
                                    });
                                });
                            }
                        });

                        // сообщение ожидания загрузки
                        selectWrapper.after('<p class="loader">Загрузка...</p>');

                        // интервал для полной загрузки
                        setTimeout(function () {
                            $('p.loader').remove();
                            $('.create_task_select .control--select--button').removeAttr('disabled');

                            // multiselect wrapper
                            multiselectWrapper = `
                                <div class="widget_settings_block__item_field create_task_multiselect_wrapper"
                                    style="border: 1px solid #dbdedf;">
                                    <div class="widget_settings_block__input_field"></div>
                                </div>
                            `;

                            // добавляем в настройки и выравниваем multiselect wrapper
                            selectWrapper.after(multiselectWrapper);
                            $('.create_task_multiselect_wrapper').css('padding', '0');
                            $('div.create_task_multiselect_wrapper .widget_settings_block__input_field').css({
                                'height': 'auto',
                                'max-height': '140px',
                                'overflow-y': 'scroll',
                                'overflow-x': 'hidden',
                                'width': '100%'
                            });

                            // добавляем checkbox'ы в multiselect wrapper
                            $.each(statuses, function () {
                                // checkbox'ы статусов воронок
                                var createTaskMultiselect = self.addCheckbox(
                                    'create_task_multiselect',
                                    'create-task-multiselect',
                                    this.id,
                                    this.name,
                                    this.name
                                );

                                // добавляем и красим checkbox'ы в соответствующие цвета
                                $('.create_task_multiselect_wrapper .widget_settings_block__input_field').append(`
                                    <div id="${ this.id }" style="background: ${ this.color }; padding: 6px 5px 3px;">
                                        ${ createTaskMultiselect }
                                    </div>
                                `);
                            });

                            // ставим checked на отмеченные ранее
                            var checkboxStatuses = $('.create_task_multiselect_wrapper .widget_settings_block__input_field').children();
                            if (checkboxes.create) {
                                var selectID = $('.create_task_select_wrapper input').val();
                                // перебор статусов в системной переменной
                                $.each(checkboxes.create, function (index, item) {
                                    if (index !== selectID) return;

                                    // если количество checkbox и элементов одинаковое, значит все checked
                                    if (item.length === checkboxStatuses.length - 1) {
                                        // кликаем отметить все и выходим
                                        $('.create_task_multiselect_wrapper .control-checkbox:first-child').click();
                                        $('.create_task_multiselect_wrapper .control-checkbox:first-child').addClass('is-checked');
                                        return;
                                    }

                                    // сравнение с существующими checkbox
                                    $.each(checkboxStatuses, function () {
                                        var statusID = $(this).attr('id');
                                        if(checkboxes.create[index].includes(statusID)) {
                                            // если присутствует в системной переменной, кликаем
                                            $(`div[id="${ statusID }"] .control-checkbox`).click();
                                            $(`div[id="${ statusID }"] .control-checkbox`).addClass('is-checked');
                                        }
                                    });
                                });
                            }

                            // добавляем статус в системную переменную
                            checkboxStatus = $('.create_task_multiselect_wrapper .control-checkbox');
                            checkboxStatus.unbind('change');
                            checkboxStatus.bind('change', function (e) {

                                var selectID = $('.create_task_select_wrapper input').val();
                                var statusID = $(e.target).attr('id');
                                checkboxStatus = $(`div[id="${ statusID }"] .control-checkbox`);
                                var checkboxStatuses = $('.create_task_multiselect_wrapper .control-checkbox');

                                // если выбран пункт Все воронки и статусы
                                if (statusID === 'null') {
                                    // отмечаем те, которые не отмечены
                                    if (checkboxStatus.hasClass('is-checked')) {
                                        $.each(checkboxStatuses, function () {
                                            if ($(this).hasClass('is-checked')) return;
                                            $(this).click();
                                            $(this).addClass('is-checked');
                                        });
                                    }
                                    else {
                                        // иначе отменяем отмеченные
                                        $.each(checkboxStatuses, function () {
                                            if (!$(this).hasClass('is-checked')) return;
                                            $(this).click();
                                            $(this).removeClass('is-checked');
                                        });
                                    }
                                }

                                // if checkbox checked
                                if (checkboxStatus.hasClass('is-checked')) {
                                    // если первая запись - создаем, иначе добавляем
                                    if (statusID === 'null') return;
                                    if (!checkboxes.create) checkboxes.create = {};
                                    if (!checkboxes.create[`${selectID}`]) checkboxes.create[`${selectID}`] = [];
                                    if (!checkboxes.create[`${selectID}`].includes(statusID)) checkboxes.create[`${selectID}`].push(statusID);
                                } else {
                                    // иначе удаляем в случае присутствия
                                    if (statusID === 'null') return;
                                    if (checkboxes.create &&
                                        checkboxes.create[`${selectID}`] &&
                                        checkboxes.create[`${selectID}`].includes(statusID)) {

                                        $.each(checkboxes.create[`${selectID}`], function (index, item) {
                                            if (item === statusID) checkboxes.create[`${selectID}`].splice(index, 1);
                                        });
                                        // при пустом массиве пользователя удаляем его из списка
                                        if (checkboxes.create[`${selectID}`].length === 0) delete checkboxes.create[`${selectID}`];
                                    }
                                }

                                // обнуляем системную переменную
                                $(`#${ self.get_settings().widget_code }_custom`).val(JSON.stringify(checkboxes));
                                $(`#${ self.get_settings().widget_code }_custom`).trigger('change');
                            });
                        }, 2000);
                    });

                } else {
                    // иначе удаляем созданные элементы
                    var selectWrapper = $('div.create_task_select_wrapper');
                    var multiselectWrapper = $('div.create_task_multiselect_wrapper');
                    selectWrapper.remove();
                    multiselectWrapper.remove();

                    // обнуляем статусы в системной переменной
                    if (checkboxes.create) {
                        checkboxes.create = {};
                        $(`#${ self.get_settings().widget_code }_custom`).val(JSON.stringify(checkboxes));
                        $(`#${ self.get_settings().widget_code }_custom`).trigger('change');
                    }
                }
            });

            // checbox checked выполнения задачи
            closeTaskCheckbox.unbind('change');
            closeTaskCheckbox.bind('change', function () {
                // if checked
                if (closeTaskCheckbox.hasClass('is-checked')) {
                    var users = [];

                    users.push({ option: 'Выберите пользователя/группу', id: 'null' })
                    // пользователи amocrm
                    $.each(AMOCRM.constant('managers'), function () {
                        users.push({ option: this.title + ` (${ this.login })`, id: this.id });
                    });
                    // группы пользователей amocrm
                    $.each(AMOCRM.constant('groups'), function (index, item) {
                        users.push({ option: item, id: index });
                    });

                    // добавляем select пользователей и групп в настройки
                    closeTaskCheckbox.closest('.widget_settings_block__item_field').append(`
                        <div class="widget_settings_block__item_field close_task_select_wrapper">
                            <div class="widget_settings_block__input_field" style="width: 100%;">
                                ${ self.addSelect(users, 'close_task_select') }
                            </div>
                        </div>
                    `);

                    // выбор пользователя/группы
                    var closeTaskSelectLi = $('.close_task_select li');
                    closeTaskSelectLi.unbind('click');
                    closeTaskSelectLi.bind('click', function (e) {
                        var statuses = [];
                        var multiselectWrapper = $('div.close_task_multiselect_wrapper');
                        var selectWrapper = $('div.close_task_select_wrapper');

                        // если пользователь не выбран, удаляем ранее созданные списки
                        if ($(e.target).text() === 'Выберите пользователя/группу') {
                            multiselectWrapper.remove();
                            $('div.close_task_multiselect_wrapper').remove();
                            return;
                        }

                        // восстанавливаем значение select'a постановки задачи
                        $.each($('.create_task_select li'), function () {
                            var selected = 'control--select--list--item-selected';
                            if ($(this).hasClass(selected)) $(this).removeClass(selected);
                            if ($(this).attr('data-value') === 'null') $(this).addClass(selected);
                            $('.create_task_select .control--select--button').text('Выберите пользователя/группу');
                        });

                        // удаляем ранее созданные списки при смене пользователя
                        multiselectWrapper.remove();
                        $('div.create_task_multiselect_wrapper').remove();
                        // блокируем кнопку до загрузки checkbox'ов
                        $('.close_task_select .control--select--button').attr('disabled', 'disabled');

                        statuses.push({
                            name: 'Все воронки и статусы',
                            id: 'null',
                            color: '#ffffff',
                            pipeline_id: null
                        });

                        // ajax воронок и статусов
                        $.ajax({
                            url: '/api/v4/leads/pipelines',
                            success: function (data) {
                                $.each(data._embedded.pipelines, function () {
                                    var pipelines_name = this.name;
                                    var pipelines_id = this.id;

                                    $.ajax({
                                        url: `/api/v4/leads/pipelines/${ pipelines_id }/statuses`,
                                        success: function (data) {
                                            $.each(data._embedded.statuses, function () {
                                                if (this.type === 1) return;

                                                statuses.push({
                                                    name: `${pipelines_name} - ${this.name}`,
                                                    // воронка : статус
                                                    id: `${this.pipeline_id}:${this.id}`,
                                                    color: this.color
                                                });
                                            });
                                        }
                                    });
                                });
                            }
                        });

                        // сообщение ожидания загрузки
                        selectWrapper.after('<p class="loader">Загрузка...</p>');

                        // интервал для полной загрузки
                        setTimeout(function () {
                            $('p.loader').remove();
                            $('.close_task_select .control--select--button').removeAttr('disabled');

                            // multiselect wrapper
                            multiselectWrapper = `
                                <div class="widget_settings_block__item_field close_task_multiselect_wrapper"
                                    style="border: 1px solid #dbdedf;">
                                    <div class="widget_settings_block__input_field"></div>
                                </div>
                            `;

                            // добавляем в настройки и выравниваем multiselect wrapper
                            selectWrapper.after(multiselectWrapper);
                            $('.close_task_multiselect_wrapper').css('padding', '0');
                            $('div.close_task_multiselect_wrapper .widget_settings_block__input_field').css({
                                'height': 'auto',
                                'max-height': '140px',
                                'overflow-y': 'scroll',
                                'overflow-x': 'hidden',
                                'width': '100%'
                            });

                            // добавляем checkbox'ы в multiselect wrapper
                            $.each(statuses, function () {
                                // checkbox'ы статусов воронок
                                var closeTaskMultiselect = self.addCheckbox(
                                    'close_task_multiselect',
                                    'close-task-multiselect',
                                    this.id,
                                    this.name,
                                    this.name
                                );

                                // добавляем и красим checkbox'ы в соответствующие цвета
                                $('.close_task_multiselect_wrapper .widget_settings_block__input_field').append(`
                                    <div id="${ this.id }" style="background: ${ this.color }; padding: 6px 5px 3px;">
                                        ${ closeTaskMultiselect }
                                    </div>
                                `);
                            });

                            // ставим checked на отмеченные ранее
                            var checkboxStatuses = $('.close_task_multiselect_wrapper .widget_settings_block__input_field').children();
                            if (checkboxes.close) {
                                var selectID = $('.close_task_select_wrapper input').val();
                                // перебор статусов в системной переменной
                                $.each(checkboxes.close, function (index, item) {
                                    if (index !== selectID) return;

                                    // если количество checkbox и элементов одинаковое, значит все checked
                                    if (item.length === checkboxStatuses.length - 1) {
                                        // кликаем отметить все и выходим
                                        $('.close_task_multiselect_wrapper .control-checkbox:first-child').click();
                                        $('.close_task_multiselect_wrapper .control-checkbox:first-child').addClass('is-checked');
                                        return;
                                    }

                                    // сравнение с существующими checkbox
                                    $.each(checkboxStatuses, function () {
                                        var statusID = $(this).attr('id');
                                        if(checkboxes.close[index].includes(statusID)) {
                                            // если присутствует в системной переменной, кликаем
                                            $(`div[id="${ statusID }"] .control-checkbox`).click();
                                            $(`div[id="${ statusID }"] .control-checkbox`).addClass('is-checked');
                                        }
                                    });
                                });
                            }

                            // добавляем статус в системную переменную
                            checkboxStatus = $('.close_task_multiselect_wrapper .control-checkbox');
                            checkboxStatus.unbind('change');
                            checkboxStatus.bind('change', function (e) {

                                var selectID = $('.close_task_select_wrapper input').val();
                                var statusID = $(e.target).attr('id');
                                checkboxStatus = $(`div[id="${ statusID }"] .control-checkbox`);
                                var checkboxStatuses = $('.close_task_multiselect_wrapper .control-checkbox');

                                // если выбран пункт Все воронки и статусы
                                if (statusID === 'null') {
                                    // отмечаем те, которые не отмечены
                                    if (checkboxStatus.hasClass('is-checked')) {
                                        $.each(checkboxStatuses, function () {
                                            if ($(this).hasClass('is-checked')) return;
                                            $(this).click();
                                            $(this).addClass('is-checked');
                                        });
                                    }
                                    else {
                                        // иначе отменяем отмеченные
                                        $.each(checkboxStatuses, function () {
                                            if (!$(this).hasClass('is-checked')) return;
                                            $(this).click();
                                            $(this).removeClass('is-checked');
                                        });
                                    }
                                }

                                // if checkbox checked
                                if (checkboxStatus.hasClass('is-checked')) {
                                    // если первая запись - создаем, иначе добавляем
                                    if (statusID === 'null') return;
                                    if (!checkboxes.close) checkboxes.close = {};
                                    if (!checkboxes.close[`${selectID}`]) checkboxes.close[`${selectID}`] = [];
                                    if (!checkboxes.close[`${selectID}`].includes(statusID)) checkboxes.close[`${selectID}`].push(statusID);
                                } else {
                                    // иначе удаляем в случае присутствия
                                    if (statusID === 'null') return;
                                    if (checkboxes.close &&
                                        checkboxes.close[`${selectID}`] &&
                                        checkboxes.close[`${selectID}`].includes(statusID)) {

                                        $.each(checkboxes.close[`${selectID}`], function (index, item) {
                                            if (item === statusID) checkboxes.close[`${selectID}`].splice(index, 1);
                                        });
                                        // при пустом массиве пользователя удаляем его из списка
                                        if (checkboxes.close[`${selectID}`].length === 0) delete checkboxes.close[`${selectID}`];
                                    }
                                }

                                // обнуляем системную переменную
                                $(`#${ self.get_settings().widget_code }_custom`).val(JSON.stringify(checkboxes));
                                $(`#${ self.get_settings().widget_code }_custom`).trigger('change');
                            });
                        }, 2000);
                    });

                } else {
                    // иначе удаляем созданные элементы
                    var selectWrapper = $('div.close_task_select_wrapper');
                    var multiselectWrapper = $('div.close_task_multiselect_wrapper');
                    selectWrapper.remove();
                    multiselectWrapper.remove();

                    // обнуляем статусы в системной переменной
                    if (checkboxes.close) {
                        checkboxes.close = {};
                        $(`#${ self.get_settings().widget_code }_custom`).val(JSON.stringify(checkboxes));
                        $(`#${ self.get_settings().widget_code }_custom`).trigger('change');
                    }
                }
            });

            // если в системной переменной есть включенные воронки, ставим галочки на обязательность
            if (checkboxes.create) {
                $.each(checkboxes.create, function () {
                    if (this.length > 0) {
                        var createTaskCheckbox = $('.create_task_checkbox_wrapper .control-checkbox');
                        createTaskCheckbox.addClass('is-checked');
                        createTaskCheckbox.click();
                        return false;
                    }
                });
            }

            if (checkboxes.close) {
                $.each(checkboxes.close, function () {
                    if (this.length > 0) {
                        var closeTaskCheckbox = $('.close_task_checkbox_wrapper .control-checkbox');
                        closeTaskCheckbox.addClass('is-checked');
                        closeTaskCheckbox.click();
                        return false;
                    }
                });
            }
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
                var closeTaskInput = $('input[name="close_task"]');
                self.closeTaskToNumber();
                closeTaskInput.val(self.close_task_length);

                // если виджет не установлен, обнуляем значение из настроек
                if (self.get_install_status() === 'not_configured') {
                    self.set_settings({ close_task: 0 });
                    self.close_task_length = null;
                    closeTaskInput.val(0);
                }

                // обязательность постановки/выполнения задачи
                self.addCheckboxSettings();

                // обнуляем системную переменную
                var checkboxes = self.get_settings().checkboxes || {};
                if (typeof checkboxes !== 'string') checkboxes = JSON.stringify(checkboxes);
                checkboxes = JSON.parse(checkboxes);

                $(`#${ self.get_settings().widget_code }_custom`).val(JSON.stringify(checkboxes));
                $(`#${ self.get_settings().widget_code }_custom`).trigger('change');
            },
            init: function () {
                return true;
            },
            bind_actions: function () {
                // запускаем прослушку элементов
                self.observerCreateTasks.observe(self.elem, self.config);
                self.observerCloseTasks.observe(self.elem, self.config);

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

                    // сообщение об ошибке на кнопке создания задачи
                    self.getTemplate('create_error_message_tasks', {}, function (template) {
                        // добавляем элемент на страницу
                        var errorMessage = template.render();
                        if (!$('body .create_error_message_tasks').length) $('body').append(errorMessage);
                    });
                }

                return true;
            },
            dpSettings: function () {},
            advancedSettings: function () {},
            destroy: function () {
                // останавливаем прослушку элементов
                self.observerCreateTasks.disconnect();
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