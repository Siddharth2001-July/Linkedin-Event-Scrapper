// Data Points
var scrappedData = {
    event_name: "",
    event_id: location.href.split("%22")[1],
    totalmembers: 0,
    total_members_scraped: 0,
    members: [
        {
            profile_url: "",
            member_name: "",
            designation: "",
            premium_member: false,
            degree_connection: "",
            location: ""
        }
    ]
}

//Function to download extracted data as JSON File
function exportToJsonFile(jsonData) {
    let dataStr = JSON.stringify(jsonData);
    let dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    let exportFileDefaultName = 'Event_' + scrappedData.event_id + '.json';

    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Main Scrapper
async function scrapper(toScrape) {
    console.log("\n **********  Fetching Data...  **********\n");
    // Getting cookie, csrf_tokenx  
    let cookie = document.cookie.split(';')[0];

    let csrf_token = /SESS\w*ID=([^;]+)/i.test(document.cookie) ? RegExp.$1 : false;
    let csrfToken = csrf_token.split('"')[1];
    if (csrfToken == "undefined") {
        csrfToken = document.cookie.split(";")[17].split("=")[1]
    }
    // console.log(cookie);
    // console.log(csrfToken);

    // Setting Headers
    var myHeader = new Headers();
    myHeader.append("cookie", cookie);
    myHeader.append("csrf-token", csrfToken);
    myHeader.append('x-restli-protocol-version', '2.0.0');

    // Setting Request
    let requestOptions = {
        method: 'GET',
        headers: myHeader,
        redirect: 'follow'
    }


    // Fetching first and other pages separetly because of different JSON format

    // Fetching first page
    let url = "https://www.linkedin.com/voyager/api/search/dash/clusters?decorationId=com.linkedin.voyager.dash.deco.search.SearchClusterCollection-128&origin=EVENT_PAGE_CANNED_SEARCH&q=all&query=(flagshipSearchIntent:SEARCH_SRP,queryParameters:(eventAttending:List(" + scrappedData.event_id + "),resultType:List(PEOPLE)),includeFiltersInResponse:false)&start=";
    await fetch(url + 0, requestOptions)
        .then(response => response.text())
        .then((result) => {

            let string = JSON.parse(result);

            // Total Members
            scrappedData.totalmembers = parseInt(string.metadata.totalResultCount);
            for (let index = 0; index < string.elements[1].results.length; index++) {
                if (scrappedData.members.length > toScrape) {
                    break;
                }
                if (string.elements[1].results[index].title.text.split(",")[0] == "LinkedIn Member") {
                    continue;
                }
                // Premium Member
                let premium = false
                if (string.elements[1].results[index].hasOwnProperty('badgeIcon')) {
                    premium = true;
                }
                // Degree Connection
                let degreeConnection = "";
                try {
                    degreeConnection = string.elements[1].results[index].badgeText.accessibilityText;
                } catch (error) { }
                // Profile Url
                let profileUrl = string.elements[1].results[index].navigationUrl;
                try {
                    profileUrl = string.elements[1].results[index].navigationUrl.split("?")[0] + "?";
                } catch (error) { }
                scrappedData.members.push({
                    profile_url: profileUrl,
                    member_name: string.elements[1].results[index].title.text.split(",")[0],
                    designation: string.elements[1].results[index].primarySubtitle.text,
                    premium_member: premium,
                    degree_connection: degreeConnection,
                    location: string.elements[1].results[index].secondarySubtitle.text
                });
            }
        })

    // Fetching next pages
    try {
        for (let i = 10; i < scrappedData.totalmembers; i = i + 10) {
            if (scrappedData.members.length > toScrape) {
                break;
            }
            await fetch(url + i, requestOptions)
                .then(response => response.text())
                .then((result) => {
                    let string = JSON.parse(result);
                    for (let index = 0; index < string.elements[0].results.length; index++) {
                        if (scrappedData.members.length > toScrape) {
                            break;
                        }
                        try {
                            if (string.elements[0].results[index].title.text.split(",")[0] == "LinkedIn Member") {
                                continue;
                            }
                            // Premium Member
                            let premium = false
                            if (string.elements[0].results[index].hasOwnProperty('badgeIcon')) {
                                premium = true;
                            }
                            // Degree Connection
                            let degreeConnection = "";
                            try {
                                degreeConnection = string.elements[0].results[index].badgeText.accessibilityText;
                            } catch (error) { }
                            // Profile Url
                            let profileUrl = string.elements[0].results[index].navigationUrl;
                            try {
                                profileUrl = string.elements[0].results[index].navigationUrl.split("?")[0] + "?";
                            } catch (error) { }
                            scrappedData.members.push({
                                profile_url: profileUrl,
                                member_name: string.elements[0].results[index].title.text.split(",")[0],
                                designation: string.elements[0].results[index].primarySubtitle.text,
                                premium_member: premium,
                                degree_connection: degreeConnection,
                                location: string.elements[0].results[index].secondarySubtitle.text
                            });
                        } catch (error) { }
                    }
                })
        }
    } catch (e) {
        console.log("!!! Error !!!");
        console.log(e);
    }

    // Exporting and logging Scrapped Data
    async function membersScrapped() {
        scrappedData.total_members_scraped = scrappedData.members.length;
        try {
            scrappedData.event_name = await document.querySelectorAll('.search-reusables__primary-filter')[1].innerText;
        } catch (error) { }
    }
    await scrappedData.members.shift();
    await membersScrapped();
    // await console.log(scrappedData);
    await exportToJsonFile(scrappedData);
}

// Reload on opening extension
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.popup) {
            location.reload();
        }
    }
);

// Attendees Page
if (location.href.startsWith("https://www.linkedin.com/search/results/people/?eventAttending=%5B%")) {
    window.onload = () => {
        try {
            let attendees;
            if (document.querySelector(".search-results-container .t-black--light").innerText.split(" ")[0].match(/^\d/))
                attendees = document.querySelector(".search-results-container .t-black--light").innerText.split(" ")[0]
            else
                attendees = document.querySelector(".search-results-container .t-black--light").innerText.split(" ")[1]

            let eveName = document.querySelectorAll('.search-reusables__primary-filter')[1].innerText;
            chrome.runtime.sendMessage({
                onPage: "event",
                attendees: attendees,
                eveName: eveName
            });
        } catch (error) { console.log(error); }
        console.log("content loaded");
    }
}

let requested = 0;
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.scrape) {
            requested = request.toScrape;
            scrapper(request.toScrape);
        }
    }
);

// scrapper(5)

console.log("Running...");