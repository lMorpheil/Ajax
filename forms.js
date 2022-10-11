import Base      from 'js/_base-controller';
import Inputmask from 'inputmask';
import Modal     from 'js/modules/modal';

export default class Forms extends Base {
    
    /**
     * Инициализация
     *
     * @returns {boolean}
     */
    _init() {
        this.$forms = $('[data-js="ajax-form"]');
        
        return true;
    }
    
    /**
     * Бинд событий
     *
     * @returns {boolean}
     */
    _bind() {
        
        this.$forms.each((i, el) => {
            this.initForm($(el));
        });
        
        this._bindTo($(window), 'modal:opened', (ev, data) => {
            this.initForm($(data).find('[data-js="ajax-form"]'));
        });
        
        return true;
    }
    
    /**
     * Инициализация формы
     *
     * @param $form
     */
    initForm($form) {
        
        if ( ! $form.length) {
            return;
        }
        
        let $input = $form.find('.input');
        
        this._bindTo($input, 'focus', (e) => {
            let $input = $(e.currentTarget);
            $input.parent().addClass('focused');
            $input.parent().removeClass('error');
        });
        
        this._bindTo($input, 'blur', (e) => {
            let $input = $(e.currentTarget);
            if ($.trim($input.val()) === '') {
                $input.parent().removeClass('focused');
            }
        });

        let options = {
            mask: '+7 (h99) 999-99-99',
            definitions: {
                'h': {
                    validator: "[0-6-9]",
                    cardinality: 1
                },
            }
        };

        let im = new Inputmask(options);
        im.mask('.input_phone');
    
        if(window.call_value) {
            $form.append('<input type="hidden" name="session_id" value="' + window.call_value + '">');
            $form.append('<input type="hidden" name="page_url" value="' + window.location.href + '">');
        }
        
        this._bindTo($form, 'submit', (ev) => {
            ev.preventDefault();
            this.ajax($(ev.target));
            return false;
        });
    }
    
    /**
     * Отправка формы
     *
     * @param $form
     */
    ajax($form) {
        let phone        = $.trim($form.find('[name="id"]').val()),
            $submit      = $form.find('[type="submit"]'),
            $input       = $form.find('.input'),
            $submit_text = $submit.find('span i'),
            text         = $submit_text.text();
        
        $form.find('.required').removeClass('error');
        $submit.prop('disabled', true);
        $submit_text.text('Отправка…');

        let phoneValidation = phone.toString().replace(/[^0-9]/g, '');

        if (((phone !== '') && (phoneValidation.length === 11))) {
            
            $.ajax({
                url: $form.attr('action'),
                type: $form.attr('method'),
                dataType: 'json',
                data: $form.serialize(),
                success: (response) => {
                    let redirect = this._nullSafe(() => response.redirect),
                        result   = this._nullSafe(() => response.result),
                        message  = this._nullSafe(() => response.message);
                        
                    if (result) {
                        if (redirect) {
                            document.location.href = `${document.location.origin}/${redirect}`;
                        } else {
                            let magnificPopup = $.magnificPopup.instance;
        
                            if (magnificPopup) {
                                magnificPopup.close();
                            }
        
                            setTimeout(() => {
                                $.ajax({
                                    url: 'modal?module=modals&view=thank',
                                    success: (response, text_status, jqXHR) => {
                                        let success = this._nullSafe(() => response.success);
                    
                                        if (success) {
                                            let view = this._nullSafe(() => response.view);
                        
                                            $(window).trigger('view:fetched', $(view));
                                        }
                                    },
                                });
                            }, 500);
                        }
                        
                        $input.val('');
                        $input.closest('.form__group').removeClass('focused');
                        
                        $form.trigger('form:done', response);
                    } else {
                        let $placeholder = $form.find('.form__group').get(0);
                        $placeholder.insertAdjacentHTML('afterbegin', `<div class="error">${message}</div>`);
                    }
                    
                },
                error: function (xhr, status, err) {
                    console.log(xhr, status, err.toString());
                    alert('Ой, что-то пошло не так! \r\n Заявку НЕ удалось отправить');
                    $submit.prop('disabled', false);
                    $submit_text.text(text);
                },
                complete: function (jqXHR, text_status) {
                    $form.trigger('form:complete', jqXHR, text_status);
                    $submit.prop('disabled', false);
                    $submit_text.text(text);
                },
            });
        } else {
            setTimeout(function () {
                $form.find('.required').addClass('error');
                $submit.prop('disabled', false);
                $submit_text.text(text);
            }, 100);
        }
    }
}
