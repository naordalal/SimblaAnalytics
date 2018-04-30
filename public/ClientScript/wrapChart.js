(function($) {
    function generateBarGraph(wrapper) {
        // Set Up Values Array
        var values = [];

        // Get Values and save to Array
        $(wrapper + ' .bar').each(function(index, el) {
            values.push($(this).data('value'));
        });

        // Get Max Value From Array
        var max_value = Math.max.apply(Math, values);

        // Set width of bar to percent of max value
        $(wrapper + ' .bar').each(function(index, el) {
            var bar = $(this),
                value = bar.data('value'),
                percent = Math.ceil((value / max_value) * 100);

            // Set Width & Add Class
            bar.width(percent + '%');
            bar.addClass('in');
        });
    }

    // Generate the bar graph on window load...
    $(window).on('load', function(event) {
        generateBarGraph('#dashboard-stats');
    });
})(jQuery); // Fully reference jQuery after this point.