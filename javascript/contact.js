// get the contact form element and if the page doesnt have one stop execution
// ensures it wont cause errors on other pages that dont have contact form
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  // helper validation function used to check if user inputs are correct
  const isAlpha = s => /^[A-Za-z]{2,100}$/.test(s.trim()); // only letters, 2-100 chars
  const isGender = v => v === 'female' || v === 'male';
  const isMobileKSA = s => /^(\+?966|0)?5\d{8}$/.test(s.trim());  // saudi phone number
  const isEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());  // valid email format
  const isLocation = v => ['jed','ruh','khobar'].includes(v);  // allowed city values only
  const sanitize = s => s.trim().replace(/[<>]/g, '');  // remove space and unsafe chars
  const within = (s, min, max) => s.length >= min && s.length <= max;  // check length

  // calculate age from dob
  function ageFromDob(dobStr) {
    const d = new Date(dobStr);
    if (Number.isNaN(d.getTime())) return null;
    const t = new Date();
    let age = t.getFullYear() - d.getFullYear();
    const m = t.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
    return age;
  }


  // validate all form inputs before sending them to the server
  function validate() {
    const first_name = document.getElementById('first-name').value;
    const last_name  = document.getElementById('last-name').value;
    const gender = (form.querySelector('input[name="gender"]:checked')||{}).value || '';
    const mobile = document.getElementById('mobile').value;
    const dob = document.getElementById('date').value;
    const email = document.getElementById('email').value;
    const location = document.getElementById('locate').value;
    const message = document.getElementById('message').value;

    // check each input, return error if invalid
    if (!isAlpha(first_name)) return ['First name must be 2–100 letters.'];
    if (!isAlpha(last_name))  return ['Last name must be 2–100 letters.'];
    if (!isGender(gender))    return ['Pick a gender.'];
    if (!isMobileKSA(mobile)) return ['Mobile must be KSA format (05xxxxxxxx or +9665xxxxxxxx).'];

    const age = ageFromDob(dob);
    if (age === null || age < 13 || age > 100) return ['Enter a valid birth date (age 13–100).'];

    if (!isEmail(email) || !within(email, 3, 150)) return ['Enter a valid email (max 150 chars).'];
    if (!isLocation(location)) return ['Pick a city.'];
    if (!within(message.trim(), 5, 2000)) return ['Message must be 5–2000 characters.'];

    // if all validations pass, return clean data to send to the server
    return [null, {
      first_name: sanitize(first_name),
      last_name: sanitize(last_name),
      gender,
      mobile: sanitize(mobile),
      dob,
      email: sanitize(email).toLowerCase(),
      location,
      message: sanitize(message)
    }];
  }

  // handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const [err, payload] = validate();
    if (err) { alert(err); return; }

    try {
      // send data to backend using fetch
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      // display the confirmation message on the page
      if (!res.ok || !data.ok) { alert(data.msg || 'Submission failed'); return; }

      const box = document.getElementById('contactResult');
      if (box) {
        box.innerHTML = `
          <h3>Message Details</h3>
          <p><strong>First Name:</strong> ${payload.first_name}</p>
          <p><strong>Last Name:</strong> ${payload.last_name}</p>
          <p><strong>Message:</strong> ${payload.message}</p>
          <p style="color:green;">Message saved successfully!</p>
        `;
      }

      // clear the form after successful submission
      form.reset();

    } catch (e2) {
      alert('Server error. Please try again.');
    }
  });
})();