var DD = DD || {};

$(document).on( 'pagebeforeshow', 'div#person', function( e, data ) {

    var page = $(e.currentTarget)
        , path = page.data('path')
        , id = '#' + page.attr('id')
        , personType = $("#person-type")
    ;

    //fetch person

    //on fetch done create options for person-type
    $.each(DD.lov["Person Types"], function (opt) {

        var option = "";

        option += '<option value="' + opt.id + '"';
//      make selected
//        if () {
//            option += ;
//        }
        option += '>' + opt.displayName;
        option += '</option>';

        $( option ).appendTo( personType );

    });

});