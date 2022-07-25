let goTo = document.querySelector(".go-to")
let onEve = document.querySelector(".on-attendee")

function remove(params) {
    params.style.display = 'none';
}
function show(params) {
    params.style.display = 'block';
}

show(goTo)


// Sending reloading message
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { popup: true })
});

chrome.runtime.onMessage.addListener((req, send, sendRes) => {
    if (req.onPage == "event") {
        remove(goTo)
        show(onEve)
        document.querySelector(".eve-name").textContent = req.eveName;
        const input = document.querySelector('#to-scrape')
        input.addEventListener('input', (e) => {
            if (e.target.value > 1000 || e.target.value < 1) {
                document.querySelector('#sub').disabled = true;
            }
            else {
                document.querySelector('#sub').disabled = false;
            }
        })
        document.querySelector('#scrape-form').addEventListener("submit", (event) => {
            event.preventDefault()
            event.stopPropagation()
            let num = parseInt(event.srcElement[0].value);
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(
                    tabs[0].id, {
                    scrape: true,
                    toScrape: num
                });
            });
            let loading = document.querySelectorAll('.load')
            loading[0].style.display = 'block'
            loading[1].style.display = 'block'
            document.querySelector('#sub').disabled = true;
        })
    }
})