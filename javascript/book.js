// get the booking form element and if the page doesnt have one stop execution
// ensures it wont cause errors on other pages that dont have booking form
(function () {
  const form = document.getElementById("bookingForm");
  if (!form) return;

  // helper function used to check if user inputs are valid
  const isEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || "").trim());
  const isMobileKSA = s => /^(\+?966|0)?5\d{8}$/.test(String(s || "").trim());
  const isTime = v => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v || "").trim());
  const sanitize = s => String(s || "").trim().replace(/[<>]/g, "");

  // date must be today or future not past
  function notPast(dstr) {
    const d = new Date(dstr);
    if (Number.isNaN(d.getTime())) return false;
    const t = new Date();
    t.setHours(0,0,0,0);
    d.setHours(0,0,0,0);
    return d >= t;
  }

  // get the value from an input element by its ID if the element does not exist return empty string
  const getVal = id => (document.getElementById(id)?.value ?? "");

  // ensure that there is a container <div> to display results or error message below the form
  function ensureResultBox() {
    let box = document.getElementById("bookingResult");
    if (!box) {
      box = document.createElement("div");
      box.id = "bookingResult";
      form.after(box);
    }
    return box;
  }

  // displays a red error message below the form
  const showError = (msg) => {
    const box = ensureResultBox();
    box.innerHTML = `<p style="color:crimson;margin-top:10px;">${msg || "Error"}</p>`;
  };

  function validate() {

  // build an object containing all form values
    const payload = {
      movie: sanitize(getVal("movie")),
      cinema: sanitize(getVal("cinema")),
      date: getVal("date"),
      time: sanitize(getVal("time")),
      tickets: Number(getVal("tickets")),
      seat: sanitize(getVal("seat")),
      popcorn: sanitize(getVal("popcorn")),
      drink: sanitize(getVal("drink")),
      offer: sanitize(getVal("offer")),
      name: sanitize(getVal("name")),
      email: sanitize(getVal("email")).toLowerCase(),
      phone: sanitize(getVal("phone")),
    };

    // validation rules
    if (!payload.movie) return ["Select a movie"];
    if (!payload.cinema) return ["Select cinema"];
    if (!payload.date || !notPast(payload.date)) return ["Choose a valid date (today or future)"];
    if (!payload.time || !isTime(payload.time)) return ["Select a valid time (HH:MM 24h)"];
    if (!Number.isInteger(payload.tickets) || payload.tickets < 1 || payload.tickets > 10)
      return ["Tickets must be 1–10"];
    if (!payload.seat) return ["Select seat type"];
    if (!payload.popcorn) return ["Select popcorn size"];
    if (!payload.drink) return ["Select drink"];
    if (!payload.offer) return ["Select an offer"];
    if (!payload.name || payload.name.length < 2) return ["Enter full name"];
    if (!isEmail(payload.email)) return ["Enter a valid email"];
    if (!isMobileKSA(payload.phone)) return ["Mobile must be 05xxxxxxxx or +9665xxxxxxxx"];
  
    // If everything passes validation return no error and the valid payload
    return [null, payload];
  }

  // creates and displays the “Booking Receipt” card showing all entered information
  function injectReceipt(targetEl, payload) {
    const ticketPrice = 45;
    const total = Number(payload.tickets) * ticketPrice;

    // remove any old card to prevent duplication
    targetEl.querySelector(".receipt-card")?.remove();

    // insert the new receipt
    targetEl.insertAdjacentHTML("beforeend", `
      <div class="receipt-card">
        <h3 class="receipt-title"> Booking Details</h3>

        <div class="kv"><span>Name:</span><strong>${payload.name}</strong></div>
        <div class="kv"><span>Movie:</span><strong>${payload.movie}</strong></div>
        <div class="kv"><span>Cinema:</span><strong>${payload.cinema}</strong></div>
        <div class="kv"><span>Date:</span><strong>${payload.date}</strong></div>
        <div class="kv"><span>Time:</span><strong>${payload.time}</strong></div>
        <div class="kv"><span>Tickets:</span><strong>${payload.tickets}</strong></div>
        <div class="kv"><span>Seat:</span><strong>${payload.seat}</strong></div>
        <div class="kv"><span>Popcorn:</span><strong>${payload.popcorn}</strong></div>
        <div class="kv"><span>Drink:</span><strong>${payload.drink}</strong></div>
        <div class="kv"><span>Offer:</span><strong>${payload.offer}</strong></div>
        <div class="kv"><span>Email:</span><strong>${payload.email}</strong></div>
        <div class="kv"><span>Phone:</span><strong>${payload.phone}</strong></div>

        <hr class="sep" />
        <div class="total-row"><span>Total:</span><strong>${total} SAR</strong></div>

        <div class="receipt-actions">
          <button id="payBtn" type="button">Pay now</button>
          <button id="homeBtn" type="button">Back to homepage</button>
        </div>

        <p id="pay-status" class="paid-text">Payment successful</p>
      </div>
    `);

    // buttons
    const payBtn = targetEl.querySelector("#payBtn");
    const homeBtn = targetEl.querySelector("#homeBtn");
    const status  = targetEl.querySelector("#pay-status");
    status.style.display = "none";

    payBtn.addEventListener("click", () => {
      status.style.display = "block";
    });
    homeBtn.addEventListener("click", () => {
      window.location.href = "/HTML/HomePage.html"; 
    });
  }

  // form submit handler runs when the user presses “Confirm Booking”
  form.addEventListener("submit", async (e) => {
    // prevent form from reloading the page
    e.preventDefault();

    // validate all inputs
    const [err, payload] = validate(); 
    if (err) { showError(err); return; }

    try {
      // send booking info to the backend
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      // try reading server response
      const raw = await res.text();
      let out = {};
      try { out = JSON.parse(raw); } catch {}

      // handle any database or validation errors from the backend
      if (!res.ok || out.ok === false) {
        showError(out.msg || raw || "Booking failed");
        return;
      }

      // success: show card with all details, total, and buttons
      const box = ensureResultBox();
      box.innerHTML = "";
      injectReceipt(box, payload);
      form.reset();

      // fail: show error
    } catch {
      showError("Server error. Try again.");
    }
  });
})();