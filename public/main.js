
(function () {
    $('#mail').keyup(function () {
        checkValuesMail()
    });

    for (var i in CKEDITOR.instances) {
        CKEDITOR.instances[i].on('change', function () {
            checkValuesMail()
        });
    }

    $.ajax({
        url: 'https://geoip-db.com/jsonp/',
        dataType: 'jsonp',
        crossDomain: true
    })

})()

function callback(res) {
    console.log(res)
    document.getElementById('ipFrame').innerHTML = `
    <div class="info">
        <p>Your IP address is <em> ${res.IPv4} </em>, browsing from <em> ${res.country_name}</em> </p>
        <a class="btn btn-primary text-white" type="button" data-toggle="collapse" data-target="#collapseMap">
            Click to see map location
        </a>
        <div class="collapse" id="collapseMap">
            <iframe src="https://www.google.com/maps/embed/v1/place?key=AIzaSyAr3-W5QaQSP93-XOj7c1eWVcWCM_UErlU&q=${res.latitude}%2C${res.longitude}&zoom=12" frameborder="0"></iframe>
        </div>
        </div>
        `;
    // <a target="_blank" href="https://maps.google.com/?q=${res.latitude},${res.longitude}&zoom=3">Click to see location</a>

}
function checkValuesMail() {

    var empty = false;
    var pattern = /^([a-z\d\-\.]+)@([a-z]+)\.[a-z]{2,4}$/
    $('#mail').each(function () {
        if ($(this).val() == '' || !pattern.test($(this).val())
            || $("iframe").contents().find("body")[0].innerHTML === "<p><br></p>"
            || $("iframe").contents().find("body")[0].innerHTML === undefined) {
            empty = true;
        }
    });

    if (empty) {
        $('#send').attr('disabled', 'disabled');
        $('#send').removeClass('fullbtn')
    } else {
        $('#send').removeAttr('disabled');
        $('#send').addClass('fullbtn')

    }
}

$('.txtFormFields').keyup(function () {

    var empty = false;
    var patternPhone = /^[+]\d{11,12}$/
    $('.txtFormFields').each(function () {
        if ($(this).val() == '' ||
            ($(this).hasClass('phone')
                && !patternPhone.test($(this).val())
            )) {
            empty = true;
        }
    });

    $('.txtFormFields.phone').val()

    if (empty) {
        $('#sendTxt').attr('disabled', 'disabled');
        $('#sendTxt').removeClass('fullbtn')
    } else {
        $('#sendTxt').removeAttr('disabled');
        $('#sendTxt').addClass('fullbtn')
    }

});

const $form = $('.contact form')

$form.on('submit', submitHandler)

function submitHandler(e) {

    $.ajax({
        type: "POST",
        url: 'sendMailForm',
        // contentType: "application/json; charset=utf-8",

        dataType: 'jsonp',
        data: JSON.stringify($form.serialize().replace('&message=', '&message=' +
            $("iframe").contents().find("body").find("p")[0].outerHTML)),
    }).done(response => {
        // if (response.split('Email has been sent').length > 1) {
        //     document.body.innerHTML = response;
        // } else {
        //     console.log(response)
        // }
        console.log(response)
    }).fail(err => {
        console.log(err)
    })
    e.preventDefault()

}