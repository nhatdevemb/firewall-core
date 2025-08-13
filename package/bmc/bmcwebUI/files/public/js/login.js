(function ($) {
    "use strict";

    /*==================================================================
    [ Validate ]*/
    var input = $('.validate-input .input100');

    $('.validate-form').on('submit', function (e) {
        var check = true;

        for (var i = 0; i < input.length; i++) {
            if (validate(input[i]) == false) {
                showValidate(input[i]);
                check = false;
            }
        }

        if (check) {
            // Gửi yêu cầu POST tới server
            Swal.fire({
                title: 'Đang xác thực...',
                text: 'Vui lòng chờ trong giây lát',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            $.ajax({
                url: '/login',
                type: 'POST',
                data: {
                    username: $('input[name="username"]').val(),
                    password: $('input[name="password"]').val()
                },
                success: function (response) {
                    // Chuyển hướng đến trang index nếu đăng nhập thành công
                    Swal.close();
                    window.location.href = '/index.html';
                },
                error: function (xhr) {
                    // Hiển thị thông báo lỗi khi đăng nhập thất bại
                    Swal.fire({
                        icon: 'error',
                        title: 'Đăng nhập thất bại',
                        text: xhr.responseJSON ? xhr.responseJSON.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.'
                    });
                }
            });
        }

        return false; // Ngăn chặn hành động mặc định
    });

    $('.validate-form .input100').each(function () {
        $(this).focus(function () {
            hideValidate(this);
        });
    });

    function validate(input) {
        if ($(input).attr('type') == 'email' || $(input).attr('name') == 'email') {
            if ($(input).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null) {
                return false;
            }
        } else {
            if ($(input).val().trim() == '') {
                return false;
            }
        }
    }

    function showValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).addClass('alert-validate');
    }

    function hideValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).removeClass('alert-validate');
    }

})(jQuery);
