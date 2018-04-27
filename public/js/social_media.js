// $('body').on('click', 'img', function(){
//     console.log($(this).next().find('h6').text());

//     var data = {
//         'username': $(this).next().find('h6').text()
//     };

//     $.ajax({
//         url: "http://localhost:3000/home",
//         data: data,
//         type: "GET",
//         success: function(response){
//             console.log(response);
//             window.location = 'home';
//             // window.location.replace('home');
//         },
//         error: console.error
//     });
// });

$('body').on('click', 'img', function(){
    $(this).parent().submit();
});

$('#searchInput').keyup(filterStreamers);

function filterStreamers() {
    var input, filter, ul, li, a, i;
    input = document.getElementById("searchInput");
    filter = input.value.toUpperCase();
    ul = document.getElementsByClassName("streamersGrid")[0];
    li = ul.getElementsByClassName("item");
    for (i = 0; i < li.length; i++) {
        a = li[i].getElementsByClassName("streamerInfo")[0];
        if (a.getElementsByTagName("h6")[0].innerHTML.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = "";
        } else {
            li[i].style.display = "none";
        }
    }
}