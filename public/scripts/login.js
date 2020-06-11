$(document).ready(() => {
  createButtonCallbacks();
  createSocketCallbacks();
})

function createButtonCallbacks() {
  $('#txt-password').keypress((keystroke) => {
    var key = keystroke.which;
    if (key === 13) {
      if ($('#txt-username').val() != "" && $('#txt-password').val() != "") {
        socket.emit('log-in',
        {
          username: $('#txt-username').val(),
          password: $('#txt-password').val(),
        });
      } else {
        alert("Username or Password can not be empty.");
      }
    }
  })

  $('#btn_login').click(() => {
    if ($('#txt-username').val() != "" && $('#txt-password').val() != "") {
      socket.emit('log-in',
      {
        username: $('#txt-username').val(),
        password: $('#txt-password').val(),
      });
    } else {
      alert("Username or Password can not be empty.");
    }
  })
}

function createSocketCallbacks() {
  socket.on('login-respond', (data) => {
    if (data.status == "OK") {
      alert(`Welcome ${data.username}, Click OK to rediect to dashboard...`);
       location.replace(`${window.location.href}dashboard`);
    } else {
      alert('Please check your Username and Password');
    }
  })
}