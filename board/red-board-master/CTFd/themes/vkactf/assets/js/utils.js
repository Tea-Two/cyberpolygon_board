import $ from "jquery";

$.fn.serializeJSON = function(omit_nulls) {
  let params = {};
  let form = $(this);
  let values = form.serializeArray();

  values = values.concat(
    form
      .find("input[type=checkbox]:checked")
      .map(function() {
        return { name: this.name, value: true };
      })
      .get()
  );
  values = values.concat(
    form
      .find("input[type=checkbox]:not(:checked)")
      .map(function() {
        return { name: this.name, value: false };
      })
      .get()
  );
  values.map(x => {
    if (omit_nulls) {
      if (x.value !== null && x.value !== "") {
        params[x.name] = x.value;
      } else {
        let input = form.find(`:input[name='${x.name}']`);
        if (input.data("initial") !== input.val()) {
          params[x.name] = x.value;
        }
      }
    } else {
      params[x.name] = x.value;
    }
  });
  return params;
};

//http://stackoverflow.com/a/2648463 - wizardry!
String.prototype.format = String.prototype.f = function() {
  let s = this,
    i = arguments.length;

  while (i--) {
    s = s.replace(new RegExp("\\{" + i + "\\}", "gm"), arguments[i]);
  }
  return s;
};

//http://stackoverflow.com/a/7616484
String.prototype.hashCode = function() {
  let hash = 0,
    i,
    chr,
    len;
  if (this.length == 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr = this.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

// https://gist.github.com/neilj/4146038
// https://fastmail.blog/2012/11/26/inter-tab-communication-using-local-storage/
export function WindowController() {
  this.id = Math.random();
  this.isMaster = false;
  this.others = {};

  window.addEventListener("storage", this, false);
  window.addEventListener("unload", this, false);

  this.broadcast("hello");

  var that = this;
  var check = function check() {
    that.check();
    that._checkTimeout = setTimeout(check, 9000);
  };
  var ping = function ping() {
    that.sendPing();
    that._pingTimeout = setTimeout(ping, 17000);
  };
  this._checkTimeout = setTimeout(check, 500);
  this._pingTimeout = setTimeout(ping, 17000);
}

WindowController.prototype.destroy = function() {
  clearTimeout(this._pingTimeout);
  clearTimeout(this._checkTimeout);

  window.removeEventListener("storage", this, false);
  window.removeEventListener("unload", this, false);

  this.broadcast("bye");
};

WindowController.prototype.handleEvent = function(event) {
  if (event.type === "unload") {
    this.destroy();
  } else if (event.key === "broadcast") {
    try {
      var data = JSON.parse(event.newValue);
      if (data.id !== this.id) {
        this[data.type](data);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
  }
};

WindowController.prototype.sendPing = function() {
  this.broadcast("ping");
};

WindowController.prototype.hello = function(event) {
  this.ping(event);
  if (event.id < this.id) {
    this.check();
  } else {
    this.sendPing();
  }
};

WindowController.prototype.ping = function(event) {
  this.others[event.id] = +new Date();
};

WindowController.prototype.bye = function(event) {
  delete this.others[event.id];
  this.check();
};

WindowController.prototype.check = function(_event) {
  var now = +new Date(),
    takeMaster = true,
    id;
  for (id in this.others) {
    if (this.others[id] + 23000 < now) {
      delete this.others[id];
    } else if (id < this.id) {
      takeMaster = false;
    }
  }
  if (this.isMaster !== takeMaster) {
    this.isMaster = takeMaster;
    this.masterDidChange();
  }
};

WindowController.prototype.masterDidChange = function() {};

WindowController.prototype.broadcast = function(type, data) {
  var event = {
    id: this.id,
    type: type
  };
  for (var x in data) {
    event[x] = data[x];
  }
  try {
    localStorage.setItem("broadcast", JSON.stringify(event));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
  }
};

export function colorHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let colour = "#";
  for (let i = 0; i < 3; i++) {
    let value = (hash >> (i * 4)) & 0xff;
    colour += ("00" + value.toString(16)).substr(-2);
  }
  return colour;
}

export function htmlEntities(string) {
  return $("<div/>")
    .text(string)
    .html();
}

export function cumulativeSum(arr) {
  let result = arr.concat();
  for (let i = 0; i < arr.length; i++) {
    result[i] = arr.slice(0, i + 1).reduce(function(p, i) {
      return p + i;
    });
  }
  return result;
}

const storage = window.localStorage;
const counter_key = "unread_notifications";

export function init_notification_counter() {
  let count = storage.getItem(counter_key);
  if (count === null) {
    storage.setItem(counter_key, 0);
  } else {
    if (count > 0) {
      $(".badge-notification").text(count);
    }
  }
}

export function set_notification_counter(count) {
  storage.setItem(counter_key, count);
}

export function inc_notification_counter() {
  let count = storage.getItem(counter_key) || 0;
  storage.setItem(counter_key, ++count);
  $(".badge-notification").text(count);
}

export function dec_notification_counter() {
  let count = storage.getItem(counter_key) || 0;
  if (count > 0) {
    storage.setItem(counter_key, --count);
    $(".badge-notification").text(count);
  }
  // Always clear if count is 0
  if (count == 0) {
    clear_notification_counter();
  }
}

export function clear_notification_counter() {
  storage.setItem(counter_key, 0);
  $(".badge-notification").empty();
}

export function copyToClipboard(event, selector) {
  // Select element
  $(selector).select();

  // Copy to clipboard
  document.execCommand("copy");

  // Show tooltip to user
  $(event.target).tooltip({
    title: "Скопировано!",
    trigger: "manual"
  });
  $(event.target).tooltip("show");

  setTimeout(function() {
    $(event.target).tooltip("hide");
  }, 1500);
}

export function makeSortableTables() {
  $("th.sort-col").append(` <i class="fas fa-sort"></i>`);
  $("th.sort-col").click(function() {
    var table = $(this)
      .parents("table")
      .eq(0);
    var rows = table
      .find("tr:gt(0)")
      .toArray()
      .sort(comparer($(this).index()));
    this.asc = !this.asc;
    if (!this.asc) {
      rows = rows.reverse();
    }
    for (var i = 0; i < rows.length; i++) {
      table.append(rows[i]);
    }
  });
  function comparer(index) {
    return function(a, b) {
      var valA = getCellValue(a, index),
        valB = getCellValue(b, index);
      return $.isNumeric(valA) && $.isNumeric(valB)
        ? valA - valB
        : valA.toString().localeCompare(valB);
    };
  }
  function getCellValue(row, index) {
    return $(row)
      .children("td")
      .eq(index)
      .text();
  }
}
