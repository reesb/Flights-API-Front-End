var root_url = "http://comp426.cs.unc.edu:3001/"

var currentPrice;
var currentCode;

var flights = [];
var seats = [];

var markers = [];
var path = [];
var boundsfitted = 0;
var current_from_code = '';
var current_to_code = '';

var homepage = 1;

var ticketstocheck = [];
var booked_tickets = [];
var ticket;
var plane_id = '';

var allInstances = [];
var sortInstancesById = [];

var from_airport = [];
var to_airport = [];

var inputs = []

$(document).ready(function() {
    //var login = {username: "annunzip", password: "730095359"};
    genCode();

    $.ajax(root_url + 'sessions',
        {
            type: 'POST',
            xhrFields: {withCredentials: true},
            data: {
                "user": {
                    "username": "reesb",
                    "password": "730089510"
                }
            },
            success: (response) => {
                console.log("logged in!");
                //();
            },
            error: (XMLHttpRequest, textStatus, errorThrown) => {
                console.log("failed login");
            }
        });

    $.ajax(root_url + 'tickets',
        {
            type: 'GET',
            xhrFields: {withCredentials: true},
            success: (response) => {
                let ticketstoclear = [];
                for (let i = 0; i < response.length; i++) {
                    $.ajax(root_url + 'tickets/' + response[i].id,
                        {
                            type: 'DELETE',
                            xhrFields: {withCredentials: true},
                            success: (response) => {
                                console.log("cleared tickets at id " + response[i].id);
                            },
                            error: (XMLHttpRequest, textStatus, errorThrown) => {
                                console.log("failed to clear ticket at " + response[i].id);
                            }
                        });
                }
                console.log("cleared all tickets");
            },
            error: (XMLHttpRequest, textStatus, errorThrown) => {
                console.log("failed to clear tickets");
            }
        });

    $.ajax(root_url + 'itineraries',
        {
            type: 'GET',
            xhrFields: {withCredentials: true},
            success: (response) => {
                //let itinerariestoclear = [];
                for (let i = 0; i < response.length; i++) {
                    $.ajax(root_url + 'itineraries/' + response[i].id,
                        {
                            type: 'DELETE',
                            xhrFields: {withCredentials: true},
                            success: (response) => {
                                console.log("cleared itinerary at id " + response[i].id);
                            },
                            error: (XMLHttpRequest, textStatus, errorThrown) => {
                                console.log("failed to clear itinerary at " + response[i].id);
                            }
                        });
                }
                console.log("cleared all itineraries");
            },
            error: (XMLHttpRequest, textStatus, errorThrown) => {
                console.log("failed to clear itineraries");
            }
        });


    $("body").on("click", "#check", function() {
        homepage = 0;
        checkPrices();
    });

    $("body").on("click", "#home", function() {
        homepage = 1;
        build_home();
    });

    $("body").on("click", "#myflights", function() {
        homepage = 0;
        build_itinerary();
    });

    $("body").on("click", ".book", function() {
        homepage = 0;

        ticket = this.parentElement;

        build_ticketpurchase_interface(this.parentElement);
    });

    $("body").on("click", "#login", function() {
        $.ajax(root_url + 'sessions',
            {
                type: 'POST',
                xhrFields: {withCredentials: true},
                data: {
                    "user": {
                        "username": $("#user").val(),
                        "password": $("#pass").val()
                    }
                },
                success: (response) => {
                    console.log("logged in!");
                    let body = $("body");
                    body.html("<div id=\"bodydiv\"><div class=\"section header\"><div class=\"hotbar container\"><div class=\"title\"><h2 style=\"padding-left: 25px;\">Reservations TM</h2></div><div class=\"logout button\"><p id=\"logout\" style=\"margin-top: 25%\">Logout</p></div></div><div class=\"nav\"><nav><button id=\"home\" class=\"nav button\" style=\"float: left;\">Home</button><!--&nbsp; &nbsp; --><button id=\"myflights\" class=\"nav button\">My Flights</button></nav></div></div><hr><div id=\"map\"></div><div id=\"content\" class=\"section content\"></div></div><script> var map; function initMap() { map = new google.maps.Map(document.getElementById('map'), { center: {lat: 48.990, lng: -97.25}, zoom: 4 }); }</script><script src=\"https://maps.googleapis.com/maps/api/js?key=AIzaSyBYwXqcik_nSangwE2rRy48HySpx50iS7k&amp;callback=initMap\" async=\"\" defer=\"\"></script>");
                    build_home();
                },
                error: (XMLHttpRequest, textStatus, errorThrown) => {
                    console.log("failed login");
                }
            });
    });

    $("body").on("click", "#bookticket", function() {

        if ($("#fname").val() == "" || $("#lname").val() == "" || $("#age").val() == "" || $("#seat").val() == "" || $("#seat").val().length < 2 || $("#seat").val().length > 3) {
            if ($("#dummy").length == 1) {
                return;
            }
            $("#seat").parent().append("<p id='dummy' style='color: red;'>Please fill out all of the fields in the appropriate format.</p>");
            return;
        } else {
            if ($("#dummy").length == 1) {
                $("#dummy").remove();
            }
            if (checkseats($("#seat").val()) == 0 || isNaN(parseInt($("#age").val()))) {
                $("#seat").parent().append("<p id='dummy' style='color: red;'>Please fill in valid information. (Seat or age)</p>");
                return;
            }
            if ($("#ticketsummary").length == 1) {
                $("#ticketsummary").remove();
            }
        }

        let fname = $("#fname").val();
        let lname = $("#lname").val();
        let age = $("#age").val();
        let gender = $("#gender").val();
        let seat = $("#seat").val();

        $("#content").append("<div id='ticketsummary'><h2>Ticket Summary</h2><p>Name: <span>" + lname + "</span>, <span>" + fname + "</span></p><p>Age: <span>" + age + "</span>" + ", Gender: <span>" + gender + "</span></p><p>Seat: " + seat + "</p><p>FROM: " + ticket.children[2].children[0].innerHTML + ", TO: " + ticket.children[2].children[1].innerHTML + "</p><p>Date: " + ticket.children[2].children[2].innerHTML + "</p><p>Departure Time: " + ticket.children[2].children[3].innerHTML + ", Arrival Time: " + ticket.children[2].children[4].innerHTML + "</p><p>Flight ID: " + ticket.children[2].children[6].innerHTML + "</p><p>Airline: " + ticket.children[0].innerHTML + "</p><p>Instance ID: " + ticket.children[2].children[5].innerHTML + "</p><hr><br><button id='confirm' class='button'>Confirm reservation</button><p style='margin-left: 20px;'>Click confirm to reserve your seat. Your seat is not booked until you click this button!</p></div>");
    });

    $(document).keypress(function(event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13') {
            if (homepage == 1) {
                homepage = 0;
                checkPrices();
            }
        }
    });

    function checkseats() {
        for (let i = 0; i < seats.length; i++) {
            if (seats[i] == $("#seat").val()) {
                return 1;
            }
        }
        return 0;
    }

    $("body").on("click", "#confirm", function() {
        ticketstocheck = [];
        let ticketsummary = document.getElementById("ticketsummary");
        let seat = '';

        seatrow = parseInt(ticketsummary.children[3].innerHTML.replace("Seat: ", ""));
        seatnumber = ticketsummary.children[3].innerHTML.replace("Seat: ", "").replace(seatrow, "");

        $.ajax(root_url + 'seats?filter[plane_id]=' + plane_id + "&filter[row]=" + seatrow + "&filter[number]=" + seatnumber,
            {
                type: 'GET',
                async: false,
                xhrFields: {withCredentials: true},
                success: (response) => {
                    seat = response[0].id;
                },
                error: (XMLHttpRequest, textStatus, errorThrown) => {
                    console.log("failed seat get");
                }
            });

        $.ajax(root_url + 'seats/' + seat,
            {
                type: 'PUT',
                async: false,
                xhrFields: {withCredentials: true},
                data: {
                    "seat": {
                        "info": "reserved",
                    }
                },
                success: (response) => {
                    console.log("seat reserved!");
                },
                error: (XMLHttpRequest, textStatus, errorThrown) => {
                    console.log("failed seat get");
                }
            });



        $.ajax(root_url + 'tickets',
            {
                type: 'GET',
                async: false,
                xhrFields: {withCredentials: true},
                success: (response) => {
                    for (let i = 0; i < response.length; i++) {
                        ticketstocheck.push(response[i]);

                    }
                },
                error: (XMLHttpRequest, textStatus, errorThrown) => {
                    console.log("Failed to check seats");
                }
            });

        if(ticketstocheck.length != 0) {
            for(let i = 0; i < ticketstocheck.length; i++) {
                if(ticketstocheck[i].seat_id == seat) {
                    if ($("#dummy").length == 1) {
                        return;
                    } else {
                        this.nextSibling.innerHTML = "Seat already reserved, please try another seat!";
                        this.nextSibling.id = "dummy";
                        this.nextSibling.style.color = "red";
                        return;
                    }
                }
            }
        }

        $.ajax(root_url + 'tickets',
            {
                type: 'POST',
                //async: false;
                xhrFields: {withCredentials: true},
                data: {
                    "ticket": {
                        "first_name": ticketsummary.children[1].children[1].innerHTML,
                        "last_name": ticketsummary.children[1].children[0].innerHTML,
                        "age": ticketsummary.children[2].children[0].innerHTML,
                        "gender": ticketsummary.children[2].children[1].innerHTML,
                        "is_purchased": true,
                        "price_paid": genPrice(),
                        "instance_id": ticketsummary.children[9].innerHTML.replace("Instance ID: ", ""),
                        "seat_id": seat,
                        "itinerary_id": currentCode
                    }
                },
                success: (response) => {
                    ticketsummary.classList.add(response.id);
                    console.log(ticketsummary);
                    booked_tickets.push(ticketsummary);
                    console.log("Confirmed ticket!");
                    this.nextSibling.style.color = "green";
                    this.nextSibling.innerHTML = "Confirmed!";
                    if ($("#dummy").length == 1) {
                        $("#dummy").remove();
                    }
                },
                error: (XMLHttpRequest, textStatus, errorThrown) => {
                    alert("failed to post ticket confirmation");
                }
            });
    });

    $("body").on("click", '.del', function(){
        $.ajax(root_url + 'tickets/' + this.parentElement.classList[1],
            {
                type: 'DELETE',
                xhrFields: {withCredentials: true},
                success: (response) => {
                    console.log("cleared ticket");
                },
                error: (XMLHttpRequest, textStatus, errorThrown) => {
                    console.log("failed to clear ticket at ");
                }
            });

        for (let i = 0; i < booked_tickets.length; i++) {
            if (booked_tickets[i].classList[0] == this.parentElement.classList[1]) {
                booked_tickets.splice(i, 1);
            }
        }

        $("."+this.parentElement.classList[1]).next().remove();
        $("."+this.parentElement.classList[1]).remove();
    });

    $("body").on("click", '.buildItnButton', function() {

        let result = $("#emailInput").val();
        if(result == "") {
            if ($("#emailerror").length == 0) {
                $(this).after("&nbsp;&nbsp;<p id='emailerror' style='margin: 0px; display: inline-block; color: red;'>Please enter an email.</p>");
                return;
            } else {
                return;
            }
        }

        $.ajax(root_url + 'itineraries',
            {
                type: 'POST',
                xhrFields: {withCredentials: true},
                data: {
                    "itinerary": {
                        "confirmation_code": currentCode,
                        "email": result
                    }
                },
                success: (response) => {
                    if ($("#itineraryposted").length == 1) {
                        $("#itineraryposted").html("Itinerary posted with code " + currentCode);
                        genCode();
                    }  else {
                        if ($("#emailerror").length == 1) {
                            $("#emailerror").remove();
                        }
                        $(this).after("<p id='itineraryposted' style='color: green;'>Itinerary posted with code " + currentCode + "</p>");
                        genCode();
                    }
                },
                error: (XMLHttpRequest, textStatus, errorThrown) => {
                    console.log("failed to make itinerary");
                }
            });
    });

    $("body").on("click", '#logout', function() {
        $.ajax(root_url + 'sessions',
            {
                type: 'DELETE',
                xhrFields: {withCredentials: true},
                success: (response) => {
                    console.log("logged out!");
                    //build_login();
                },
                error: (XMLHttpRequest, textStatus, errorThrown) => {
                    console.log("failed to log out");
                }
            });
        build_login();
    });

    var bounds = new google.maps.LatLngBounds();
    var line = '';
    markers[0] = new google.maps.Marker({
        position: {
            lat: 48.990,
            lng: -97.25
        },
        map: null
    });
    markers[1] = new google.maps.Marker({
        position: {
            lat: 48.990,
            lng: -97.25
        },
        map: null
    });

    $("body").on("focusin", "#from_input", function (){
        if ($("#from_input").is(":focus")) {
            $(this).keyup(function() {
                let input = $(this).val();
                if (input == current_from_code) {
                    return;
                }
                if (input.length == 3) {
                    $.ajax(root_url + 'airports/?filter[code]=' + input,
                        {
                            type: 'GET',
                            xhrFields: {withCredentials: true},
                            success: (response) => {
                                if (response.length == 1) {
                                    current_from_code = input;
                                    if (markers[0] == "") {
                                        var marker = new google.maps.Marker({
                                            position: {
                                                lat: parseInt(response[0].latitude.substring(0, 6)),
                                                lng: parseInt(response[0].longitude.substring(0, 6))
                                            },
                                            map: map
                                        });
                                    } else {
                                        markers[0].setMap(null);
                                        var marker = new google.maps.Marker({
                                            position: {
                                                lat: parseInt(response[0].latitude.substring(0, 6)),
                                                lng: parseInt(response[0].longitude.substring(0, 6))
                                            },
                                            map: map
                                        });
                                    }

                                    markers[0] = marker;

                                    for (let i = 0; i < markers.length; i++) {
                                        bounds.extend(markers[i].getPosition());
                                    }
                                    map.fitBounds(bounds);
                                    path[0] = {
                                        lat: parseInt(response[0].latitude.substring(0, 6)),
                                        lng: parseInt(response[0].longitude.substring(0, 6))
                                    };
                                    if (markers.length = 2) {
                                        if (line == "") {
                                            line = new google.maps.Polyline({
                                                path: path,
                                                strokeColor: "#FF0000",
                                                strokeOpacity: 1.0,
                                                strokeWeight: 10,
                                                map: map
                                            });
                                        } else {
                                            line.setMap(null);
                                            line = new google.maps.Polyline({
                                                path: path,
                                                strokeColor: "#FF0000",
                                                strokeOpacity: 1.0,
                                                strokeWeight: 10,
                                                map: map
                                            });
                                        }
                                    }
                                }
                            },
                            error: (XMLHttpRequest, textStatus, errorThrown) => {
                                console.log("could not filter airports");
                            }
                        });
                }
            });
        }
    });

    $("body").on("focusin", "#to_input", function (){
        if ($("#to_input").is(":focus")) {
            $(this).keyup(function() {
                let input = $(this).val();
                if (input == current_to_code) {
                    return;
                }
                if (input.length == 3) {
                    $.ajax(root_url + 'airports/?filter[code]=' + input,
                        {
                            type: 'GET',
                            xhrFields: {withCredentials: true},
                            success: (response) => {
                                if (response.length == 1) {
                                    current_to_code = input;
                                    if (markers[1] == "") {
                                        var marker = new google.maps.Marker({
                                            position: {
                                                lat: parseInt(response[0].latitude.substring(0, 6)),
                                                lng: parseInt(response[0].longitude.substring(0, 6))
                                            },
                                            map: map
                                        });
                                    } else {
                                        markers[1].setMap(null);
                                        var marker = new google.maps.Marker({
                                            position: {
                                                lat: parseInt(response[0].latitude.substring(0, 6)),
                                                lng: parseInt(response[0].longitude.substring(0, 6))
                                            },
                                            map: map
                                        });
                                    }

                                    markers[1] = marker;

                                    for (let i = 0; i < markers.length; i++) {
                                        bounds.extend(markers[i].getPosition());
                                    }
                                    map.fitBounds(bounds);
                                    path[1] = {lat: parseInt(response[0].latitude.substring(0, 6)), lng: parseInt(response[0].longitude.substring(0, 6))};
                                    if (markers.length = 2) {
                                        if (line == "") {
                                            line = new google.maps.Polyline({
                                                path: path,
                                                strokeColor: "#FF0000",
                                                strokeOpacity: 1.0,
                                                strokeWeight: 10,
                                                map: map
                                            });
                                        } else {
                                            line.setMap(null);
                                            line = new google.maps.Polyline({
                                                path: path,
                                                strokeColor: "#FF0000",
                                                strokeOpacity: 1.0,
                                                strokeWeight: 10,
                                                map: map
                                            });
                                        }
                                    }
                                }
                            },
                            error: (XMLHttpRequest, textStatus, errorThrown) => {
                                console.log("could not filter airports");
                            }
                        });
                }
            });
        }
    });

});

/*$("body").on("click", '.byTimeIncButton', function()*/function sortByTimeInc() {
    for(let i = 0; i < allInstances.length; i++) {
        sortInstancesById[i] = allInstances[i];
    }
    var len = sortInstancesById.length;
    for (let i = len-1; i>=0; i--){
        for(let j = 1; j<=i; j++){
            if(sortInstancesById[j-1].children[0].children[2].children[3].innerHTML > sortInstancesById[j].children[0].children[2].children[3].innerHTML){
                var temp = sortInstancesById[j-1];
                sortInstancesById[j-1] = sortInstancesById[j];
                sortInstancesById[j] = temp;
            }
        }
    }

    $("#allticketsdiv").empty();
    $("#allticketsdiv").append(sortInstancesById);
}//);
/*$("body").on("click", '.byTimeDecButton', function()*/function sortByTimeDec() {
    for(let i = 0; i < allInstances.length; i++) {
        sortInstancesById[i] = allInstances[i];
    }
    var len = sortInstancesById.length;
    for (let i = len-1; i>=0; i--){
        for(let j = 1; j<=i; j++){
            if(sortInstancesById[j-1].children[0].children[2].children[3].innerHTML < sortInstancesById[j].children[0].children[2].children[3].innerHTML){
                var temp = sortInstancesById[j-1];
                sortInstancesById[j-1] = sortInstancesById[j];
                sortInstancesById[j] = temp;
            }
        }
    }

    $("#allticketsdiv").empty();
    $("#allticketsdiv").append(sortInstancesById);
}//);
/*$("body").on("click", '.byIdIncButton', function()*/function sortByIdInc() {
    for(let i = 0; i < allInstances.length; i++) {
        sortInstancesById[i] = allInstances[i];
    }
    var len = sortInstancesById.length;
    for (let i = len-1; i>=0; i--){
        for(let j = 1; j<=i; j++){
            if(sortInstancesById[j-1].children[0].children[2].children[5].innerHTML > sortInstancesById[j].children[0].children[2].children[5].innerHTML){
                var temp = sortInstancesById[j-1];
                sortInstancesById[j-1] = sortInstancesById[j];
                sortInstancesById[j] = temp;
            }
        }
    }

    $("#allticketsdiv").empty();
    $("#allticketsdiv").append(sortInstancesById);
}//);
/*$("body").on("click", '.byIdDecButton', function()*/function sortByIdDec() {
    for(let i = 0; i < allInstances.length; i++) {
        sortInstancesById[i] = allInstances[i];
    }

    var len = sortInstancesById.length;
    for (let i = len-1; i>=0; i--){
        for(let j = 1; j<=i; j++){
            if(sortInstancesById[j-1].children[0].children[2].children[5].innerHTML < sortInstancesById[j].children[0].children[2].children[5].innerHTML){
                var temp = sortInstancesById[j-1];
                sortInstancesById[j-1] = sortInstancesById[j];
                sortInstancesById[j] = temp;

            }
        }
    }

    $("#allticketsdiv").empty();
    $("#allticketsdiv").append(sortInstancesById);
}//);

function build_home() {

    homepage = 1;

    flights = [];
    allInstances = [];
    sortInstancesById = [];

    from_airport = [];
    to_airport = [];

    inputs = []

    let content = $("#content");

    content.empty();

    let htmlstring = '<div class="content header"><h1>Where to?</h1></div><br><p id=\'error\' style=\'color: red; visibility: hidden;\'>Please fill out all three fields.</p><div class="data_input" style="text-align: center;"><div class="inp" style="margin-left: 268px;"> <!-- 150, 288 --><label for="from_input">From:</label><input id="from_input" name="from_input" type="text" placeholder="FLL"><label for="from_input" style="font-size: 9pt;">(3-digit airport code)</label></div><div class="inp"><label for="from_input">To:</label><input id="to_input" name="to_input" type="text" placeholder="LAX"><label for="from_input" style="font-size: 9pt;">(3-digit airport code)</label></div><div class="inp"><label for="from_input">Departure date:</label><input id="depart_input" name="depart_input" type="text" placeholder="2019-01-11"><label for="from_input" style="font-size: 9pt;">(yyyy-mm-dd)</label></div><!--<div class="inp"><label for="from_input">Return date:</label><input name="return_input" type="text"></div>--><button id="check">Check Flights!</button></div>'

    content.html(htmlstring);
    //https://www.textfixer.com/html/compress-html-compression.php
}

function build_itinerary() {
    let content = $("#content");
    content.empty();
    let htmlstring = '<div class="content header"><h1>Current Booked Flights</h1></div>';
    content.html(htmlstring);

    spacer = document.createElement("div");
    spacer.classList.add("spacer");
    content.append(spacer);

    let delButton = document.createElement("button");
    delButton.classList.add("del");
    delButton.classList.add("button");
    delButton.innerHTML = "Cancel?";

    for (let i = 0; i < booked_tickets.length; i++) {
        let currentBookId = booked_tickets[i].classList[0];
        $("#content").append("<div class='flighttickets " + currentBookId + "'><h4>" + booked_tickets[i].children[8].innerHTML.replace('Airline: ', '') + "</h4><p>" + booked_tickets[i].children[4].innerHTML + " - " + booked_tickets[i].children[5].innerHTML + " - " + booked_tickets[i].children[6].innerHTML + " - " + booked_tickets[i].children[7].innerHTML + " - " + booked_tickets[i].children[9].innerHTML + "</p><p>" + booked_tickets[i].children[1].innerHTML + " - " + booked_tickets[i].children[3].innerHTML + " - " + booked_tickets[i].children[7].innerHTML + "</p></div>");
        spacer = document.createElement("div");
        spacer.classList.add("spacer");
        content.append(spacer);
    }
    $(".flighttickets").append(delButton);
    $("#content").append("<div style='margin-top: 10px;'><input name='email' id='emailInput' placeholder='example@gmail.com' type='text'>&nbsp;&nbsp;<button class = buildItnButton button>Build Itinerary With Current Tickets!</button></div>");
}

function build_ticketpurchase_interface(instancediv) {
    seats = [];
    plane_id = '';
    let content = $("#content");

    content.empty();

    let flight_id = instancediv.children[2].children[6].innerHTML;
    let img_url = '';

    $.ajax(root_url + 'flights/' + flight_id,
        {
            type: 'GET',
            xhrFields: {withCredentials: true},
            async: false,
            success: (response) => {
                plane_id = response.plane_id;
                $.ajax(root_url + 'planes/' + response.plane_id,
                    {
                        type: 'GET',
                        xhrFields: {withCredentials: true},
                        async: false,
                        success: (response2) => {
                            img_url = response2.seatmap_url;
                        },
                        error: (XMLHttpRequest, textStatus, errorThrown) => {
                            alert("error");
                        }
                    });
            },
            error: (XMLHttpRequest, textStatus, errorThrown) => {
                alert("error");
            },
            complete: () => {
                $.ajax(root_url + '/seats?filter[plane_id]=' + plane_id,
                    {
                        type: 'GET',
                        xhrFields: {withCredentials: true},
                        success: (response) => {

                            for(let i = 0; i < response.length; i++) {
                                seats[i] = response[i].row + response[i].number;
                            }

                        },
                        error: (XMLHttpRequest, textStatus, errorThrown) => {
                            console.log("no seats");
                        }
                    });
            }
        });

    content.html("<div id='ticketinfo'><h2>Purchase Ticket</h2><p>Please enter the following information to reserve your seat. Use the seatmap provided to pick a valid seat.</p><div><label for='fname'>First Name: </label><input name='fname' id='fname' placeholder='Rees' type='text'></div><br><div><label for='lname'>Last Name:</label><input name='lname' id='lname' placeholder='Braam' type='text'></div><br><div><label for='fname'>Age: </label><input name='fname' id='age' placeholder='20' type='text'></div><br><div><label for='gender'>Gender: </label><select name='gender' id='gender'><option value='Male'>Male</option><option value='Female'>Female</option></select></div><br><div><label for='seat'>Seat (ex: \"1A\"): </label><input name='seat' id='seat' placeholder='1A' type='text'></div><br><hr><br><button id='bookticket' class='button'>Reserve seat</button></div>");

    //$(document).ajaxStop(function() {
    content.append("<img id=\"seatmap\" src=" + img_url + " alt='https://www.google.com/url?sa=i&source=images&cd=&cad=rja&uact=8&ved=2ahUKEwjs6q751pPfAhUkWN8KHRrrBvAQjRx6BAgBEAU&url=http%3A%2F%2Fwww.evolvefish.com%2FQuestion-Mark-Vinyl-Decal_p_563.html&psig=AOvVaw1fFdCcrNuRWYU0xjoYeEpk&ust=1544476899534159'>");
    //});




    //$(#content).innerHtml += ('<div class = "seatInput"><input type="text"  class = "seatText"></div><div class = "submitButton"><button class = submitSeat>Select Seat</button></div>');
}

function checkPrices() {
    //let htmlstring = '<div class="content header"><h1>Current Booked Flights</h1></div>';

    let from_input = $("#from_input").val();
    let to_input = $("#to_input").val();
    let depart_input = $("#depart_input").val();

    inputs[0] = $("#from_input").val();
    inputs[1] = $("#to_input").val();
    inputs[2] = $("#depart_input").val();

    if (inputs[0] == "" || inputs[1] == "" || inputs[2] == "") {
        $("#error").html("Please fill out all three fields.");
        $("#error").css('visibility', 'visible');
        return;
    } else if (inputs[0].length != 3 || inputs[1].length != 3) {
        $("#error").html("Please put a valid airport code in the 'From' and 'To' fields.");
        $("#error").css('visibility', 'visible');
        return;
    }
    else if (inputs[2].length != 10)
    {
        $("#error").html("Please enter a valid date.");
        $("#error").css('visibility', 'visible');
        return;
    }

    let flight_ids = [];
    let requested_flights = [];

    $.ajax(root_url + 'airports?filter[code]=' + from_input,
        {
            type: 'GET',
            xhrFields: {withCredentials: true},
            async: false,
            success: (response) => {
                from_airport.push(response[0]);
            },
            error: (XMLHttpRequest, textStatus, errorThrown) => {
                alert("error");
            }
        });

    $.ajax(root_url + 'airports?filter[code]=' + to_input,
        {
            type: 'GET',
            xhrFields: {withCredentials: true},
            async: false,
            success: (response) => {
                to_airport.push(response[0]);
            },
            error: (XMLHttpRequest, textStatus, errorThrown) => {
                alert("error");
            }
        });

    $.ajax(root_url + 'flights?filter[departure_id]=' + from_airport[0].id + "&filter[arrival_id]=" + to_airport[0].id,
        {
            type: 'GET',
            xhrFields: {withCredentials: true},
            async: false,
            success: (response) => {
                for (let i = 0; i < response.length; i++) {
                    flights[i] = response[i];
                }
            },
            error: (XMLHttpRequest, textStatus, errorThrown) => {
                alert("error");
            }
        });

    build_flight_list();  //Test: from FLL to MCO
}

function build_flight_list() {

    let content = $("#content");

    content.empty();

    /*$(content).prepend('<div class = "buttons"><button class = "byIdIncButton">Sort Flights By ID (Increasing)</button></div>');
    $(content).prepend('<div class = "buttons"><button class = "byIdDecButton">Sort Flights By ID (Decreasing)</button></div>');
    $(content).prepend('<div class = "buttons"><button class = "byTimeIncButton">Sort Flights By Depart Time (Increasing)</button></div>');
    $(content).prepend('<div class = "buttons"><button class = "byTimeDecButton">Sort Flights By Depart Time (Decreasing)</button></div>');*/
    $("#content").append("<h2 style=\"color: navy; margin-bottom: 15px; padding-left: 10px; display: inline-block;\">Tickets</h2>");
    $("#content").append("<div style=\"float: right;\"id='sortselect'></div>");
    $("#sortselect").append("<p style=\"padding-left: 10px; margin: 0px; display: inline-block;\">Sort by: </p>");
    $("#sortselect").append("&nbsp;<select id='selectsort' style=\"padding-left: 10px; display: inline-block;\"><option>Select one...</option><option class='byIdIncButton'>Instance ID (Increasing)</option><option class='byIdDecButton'>Instance ID (Decreasing)</option><option class='byTimeIncButton'>Departure Time (Increasing)</option><option class='byTimeDecButton'>Departure Time (Increasing)</option></select>");

    var sortchosen = document.getElementById('selectsort');
    sortchosen.onchange = function() {
        if(sortchosen.selectedIndex == 1)
            sortByIdInc();
        if(sortchosen.selectedIndex == 2)
            sortByIdDec();
        if(sortchosen.selectedIndex == 3)
            sortByTimeInc();
        if(sortchosen.selectedIndex == 4)
            sortByTimeDec();
    }

    spacer = document.createElement("div");
    spacer.classList.add("spacer");
    content.append(spacer);

    let allticketsdiv = document.createElement("div");
    allticketsdiv.id = 'allticketsdiv';
    content.append(allticketsdiv);

    for (let i = 0; i < flights.length; i++) {
        allticketsdiv.append(build_ticketlist(flights[i]));
    }
}

function build_ticketlist(flight) {

    let id = flight.airline_id;
    let airline = "";

    $.ajax(root_url + "airlines/" + id,
        {
            type: 'GET',
            xhrFields: {withCredentials: true},
            async: false,
            success: (response) => {
                airline = response.name;
            },
            error: (XMLHttpRequest, textStatus, errorThrown) => {
                alert("error");
            }
        });

    let outerdiv = document.createElement("div");
    outerdiv.classList.add("outerdiv");

    let instances = [];

    $.ajax(root_url + 'instances?filter[flight_id]=' + flight.id + "&filter[date]=" + inputs[2],
        {
            type: 'GET',
            xhrFields: {withCredentials: true},
            async: false,
            success: (response) => {
                for (let i = 0; i < response.length; i++) {
                    let ticketdiv = document.createElement("div");
                    ticketdiv.classList.add("ticketdiv");
                    let title = document.createElement("h4");
                    let info = document.createElement("p");
                    let bookbutton = document.createElement("button");
                    bookbutton.classList.add("book");
                    bookbutton.classList.add("button");
                    bookbutton.innerHTML = "Book flight now!";

                    instances[i] = response[i];

                    let departure_time = flight.departs_at;
                    departure_time = departure_time.replace(departure_time.substring(0, 11), "");
                    departure_time = departure_time.replace(departure_time.substring(5, 13), "");

                    let arrival_time = flight.arrives_at;
                    arrival_time = arrival_time.replace(arrival_time.substring(0, 11), "");
                    arrival_time = arrival_time.replace(arrival_time.substring(5, 13), "");

                    info.innerHTML = "From: <span>" + inputs[0] + "</span>" +  ", To: <span>" + inputs[1] + "</span> - Date: <span>" + response[i].date + "</span> - Departure time: <span>" + departure_time + "</span>"+ ", Arrival time: <span>" + arrival_time + "</span> - Instance ID: <span>" + response[i].id + "</span>" + " - Flight ID: <span>" + flight.id + "</span>";
                    title.innerHTML = airline;

                    ticketdiv.append(title);
                    ticketdiv.append(bookbutton);
                    ticketdiv.append(info);
                    spacer = document.createElement("div");
                    spacer.classList.add("spacer");
                    outerdiv.append(ticketdiv);

                    outerdiv.append(spacer);

                    allInstances.push(outerdiv);
                }
            },
            error: (XMLHttpRequest, textStatus, errorThrown) => {
                alert("error");
            }
        });
    if(instances.length == 0) {
        if ($("#noflights").length == 0) {
            $("#content").append('<div id = noflights>There are no flights available! Please hit home and try again with different inputs!</div>');
        }
    } else {
        if ($("#noflights").length > 0) {
            $("#noflights").remove();
        }
    }
    return outerdiv;
}

function build_login() {
    let body = $("body");
    body.empty();
    body.append("<h2 style=\"margin: 0px\">Login</h2><p style=\"margin-top: 0px\">Enter username and password</p><input id=\"user\" type=\"text\" value=\"reesb\"><br><input id=\"pass\" type=\"password\" value=\"730089510\"><br><button class=\"button\" id=\"login\">Login</button><p id=\"status\"></p>");
}

function genCode() {
    currentcode = 0;
    currentCode = Math.floor(100000000 + Math.random() * 900000000);
    return currentCode;
}
function genPrice() {
    currentPrice = 0;
    currentPrice = Math.floor(100 * Math.random());
    return currentPrice;
}