$(document).ready(function() {

    $('.plan').on('click', function(e) {
        e.preventDefault();
        checkSelectedPlan(this);
    });

    // payment selection
    $('.panel').on('click', function(e) {
        $('#payment_method').val($(this).data('payment-method'));
    });

    var checkSelectedPlan = function(selected) {
        // we remove all selected
        $('.selected').removeClass('selected');
        // add it as selected
        $(selected).closest(".plan").addClass('selected');
        // update our price
        var price = $(selected).data('package').cost;
        var plan = $(selected).data('package').plan;
        var special = $(selected).data('package').special;
        $('#plan').val(plan);
        $('.order-total-value').html('$' + price);
        if (plan === 'monthly') {
            if (special === 'POPCORNTIME') {
                $('.billing-cycle').html('For the 1st month, then $4.99 / month');
            } else {
                $('.billing-cycle').html('Billed every month.');
            }
        } else {
            $('.billing-cycle').html('Billed every 12 months.');
        }

    }
    if ($('.selected').length > 0) {
        checkSelectedPlan($('.selected'));
    };

});
