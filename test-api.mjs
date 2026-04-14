const url = "https://script.google.com/macros/s/AKfycbwosS_n9iKOE6tJ4HNgL61PtMop3H3aTb-Ur-5U4En8ddwdAnh5tTgzJmI1BIcWzBh5kw/exec";

async function testApi() {
  console.log("Sending Register...");
  let res1 = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "register", "userId": "syifa@example.com" })
  });
  console.log("Register response:", await res1.text());

  console.log("Sending Insert...");
  let res2 = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "insert", "userId": "syifa@example.com", "item": "Sistem test", "amount": 10000, "category": "Lainnya", "tanggal": "2026-04-14" })
  });
  console.log("Insert response:", await res2.text());
}

testApi();
