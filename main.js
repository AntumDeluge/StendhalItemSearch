"use strict";

(function() {

const types = {
	"armors": "plate_armor",
	"arrows": "wooden_arrow",
	"axes": "battle_axe",
	"books": "book_blue",
	"boots": "mainio_boots",
	"boxes": "stocking",
	//~ "capturetheflag": "",
	"cloaks": "royal_cloak",
	"clubs": "grand_warhammer",
	"containers": "bottle_eared",
	"crystals": "crystal_pink",
	"documents": "paper",
	"drinks": "greater_potion",
	"flowers": "rose",
	"food": "carrot",
	"helmets": "red_helmet",
	"herbs": "arandula",
	"jewellery": "emerald",
	"keys": "purple",
	"legs": "golden_legs",
	"miscs": "dice",
	"missiles": "wooden_spear",
	"money": "gold",
	"ranged": "longbow",
	"relics": "amulet",
	"resources": "wood",
	"rings": "medicinal_ring",
	"scrolls": "fado",
	"shields": "enhanced_lion_shield",
	"special": "mythical_egg",
	"swords": "scimitar",
	"tokens": "darkyellow_round_token",
	"tools": "pick"
};

const altnames = {
  "arrows": "ammunition"
}

const keepplural = {
  "boots": true,
  "documents": true,
  "legs": true
}

const endsE = {
  "axes": true,
  "missiles": true,
  "resources": true
}

function singularOf(st) {
  if (altnames[st]) {
    st = altnames[st];
  }
  if (keepplural[st]) {
    return st;
  }

  while (st.toLowerCase().endsWith("es")) {
    if (endsE[st]) {
      break;
    }
    st = st.substring(0, st.length-2);
  }
  while (st.toLowerCase().endsWith("s")) {
    st = st.substring(0, st.length-1);
  }
  return st;
}

let version = [];
function parseVersion(text) {
  text = text.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  for (const li of text.split("\n")) {
    if (li.startsWith("version\.old")) {
      version = li.split("=")[1].trim().split(".");
      break;
    }
  }
}

const baseUrlPrefix = "https://raw.githubusercontent.com/arianne/stendhal/";
async function fetchVersion() {
  const url = baseUrlPrefix + "master/build.ant.properties";
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "text/plain"
      }
    });
    const text = await res.text();
    parseVersion(text);
  } catch (e) {
    const errmsg = "Failed to parse version information: " + url;
    console.error(errmsg, e);
    alert(errmsg);
  }
}

function formatVersionSlug() {
  return "VERSION_" + escape("0"+version[0]).slice(-2) + "_RELEASE_"
      + escape(version[1])
}

function getImageUrl(itype, iname) {
  return baseUrlPrefix + formatVersionSlug() + "/data/sprites/items/"
      + itype + "/" + iname.replace(/ |%20/g, "_") + ".png";
}

const cache = {};
function getImage(itype, iname) {
  // TODO:
  // - crop animated sprites & store in disk cache

  const imageUrl = getImageUrl(itype, iname);
  // check session cache first
  let img = cache[imageUrl];
  if (img) {
    return img;
  }

  img = new Image();
  img.src = imageUrl;
  // store in session cache
  cache[imageUrl] = img;
  return img;
}

function getHomeUrl(itype, iname) {
  return "https://stendhalgame.org/item/" + itype + "/"
      + iname.replace(/ |%20/g, "_") + ".html";
}

function cropImage(img) {
  const h = img.naturalHeight;
  const canvas = document.getElementById("cropper");
  canvas.width = h;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img,
      0, 0, h, h,
      0, 0, h, h);
  const dataUrl = canvas.toDataURL("image/png");
  ctx.clearRect(0, 0, h, h);
  canvas.width = 0;
  canvas.height = 0;
  return new Image(dataUrl);
}

const ce = document.createElement.bind(document);

function cext(tag, props) {
  props = props || {};
  const e = ce (tag);
  for (var s in props){
    e[s] = props[s];
  }
  return e;
}

function append(what, where) {
  where = where || document.body;
  where.appendChild(what);
};

async function init() {
  const title = cext("div", {id: "title", innerHTML: "Stendhal " + version.join(".")});
  append(title);
  const typesContainer = cext("div", {id: "container"});
  append(typesContainer);
  const icons = cext("div", {id: "images"});

  const selectType = ce("select");
  const dummyoption = cext("option", {
    value: -1,
    textContent: "--select one--"
  });
  append(dummyoption, selectType);
  append(selectType, typesContainer);

  const showIcons = cext("input", {
    value: "showicons",
    type: "button",
    onclick: function() {
      icons.style.display = '';
    }
  });
  showIcons.style.display = "none";
  append(showIcons, typesContainer);
  append(icons, typesContainer);
  for (const itype of Object.keys(types)) {
    const iname = types[itype];
    if (iname) {
      const iconContainer = cext("div");
      const caption = cext("span", {textContent: itype});
      const img = getImage(singularOf(itype), iname);
      img.className = "caticon";

      append(img, iconContainer);
      append(caption, iconContainer);

      append(iconContainer, icons);
      iconContainer.addEventListener('click', function (e) {
        selectType.value = e.currentTarget.getElementsByTagName("span")[0].textContent;
        icons.style.display  = "none";
        showIcons.style.display = "";
        typeSelectChange({target:selectType});
      });
    }

    let option = cext("option", {
      textContent: itype,
      value: itype
    });
    append(option, selectType);
  }

  selectType.autocomplete = "off";
  selectType.addEventListener("change", typeSelectChange);
  const items = cext("div", {
    id:"items"
  });
  append(items, typesContainer);
}

var oldSortColumn = -1;
var sortOrder = "asc";
let sortColumnIndex = 0;

function sortBy(e) {
  const target = e.target;
  const tr = target.parentNode;
  for (var i = 0, n = tr.childNodes.length; i < n; ++i) {
    if (tr.childNodes[i] == target){
      sortColumnIndex = i;
      break;
    }
  }

  const table = document.getElementsByTagName("table")[0];
  let rows = table.getElementsByTagName("tr");

  rows = Array.prototype.slice.call(rows, 1);
  for (var i = 0; i < rows.length; ++i) {
    table.removeChild(rows[i]);
  }

  if (oldSortColumn == sortColumnIndex) {
    if (sortOrder == "asc") {
      sortOrder = "desc";
    } else {
      sortOrder = "asc";
    }
  } else {
    sortOrder = "asc";
  }

  function comparator(a, b) {
    a = a.getElementsByTagName("td")[sortColumnIndex].textContent;
    b = b.getElementsByTagName("td")[sortColumnIndex].textContent;
    let ia = parseFloat(a);
    let ib = parseFloat(b);
    let r = 0;
    if (!isNaN(ia)) {
      if (!isNaN(ib)) {
        r = ia - ib;
      } else {
        ib = 0;
        r = ia - ib;
      }
    } else {
      if (!isNaN(ib)) {
        ia = 0;
        r = ia - ib;
      } else {
        r = (""+a).localeCompare(""+b);
      }
    }
    if (sortOrder != "asc") {
      r = -1 * r;
    }
    return r;
  }

  Array.prototype.sort.call(rows, comparator);
  for (var i = 0; i < rows.length; ++i) {
    table.appendChild(rows[i]);
  }
  oldSortColumn = sortColumnIndex;
}

function parseResistances(allAttributes, attributes, item, type) {
  const resistances = item.getElementsByTagName(type);
  for (var j = 0; j < resistances.length; ++j) {
    const attributeName = resistances[j].attributes[0].nodeValue;
    const value = resistances[j].attributes[1].nodeValue;
    allAttributes[attributes[attributeName]] = value;
  }
  return allAttributes;
}

async function fetchXML(url) {
  const response = await fetch(url);
  const xml = await response.text();
  const parser = new DOMParser();
  const xmlDoc  = parser.parseFromString(xml, "text/xml");
  return xmlDoc;
}

async function typeSelectChange(e) {
  if (e.target.value == -1){
    return;
  }

  const excluded = {
    "max_quantity": true,
    "menu": true,
    "quantity": true,
    "unattainable": true,
    "use_sound": true
  };

  const url = "https://raw.githubusercontent.com/arianne/stendhal/VERSION_"
      + escape("0"+version[0]).slice(-2) + "_RELEASE_"
      + escape(version[1]) + "/data/conf/items/"
      + escape(e.target.value) + ".xml";

  try {
    const xmlDoc  = await fetchXML(url);
    const itemsDiv = document.getElementById("items");
    itemsDiv.textContent = "";
    const attributes = {};
    let attributeCount = 1;
    const items = xmlDoc.getElementsByTagName("item");
    for (i = 0; i < items.length; ++i) {
      const item = items[i];
      let itemAttributes = item.getElementsByTagName("attributes");
      if (itemAttributes.length == 1) {
        itemAttributes = itemAttributes[0];
        for (let j = 0; j < itemAttributes.children.length; ++j) {
          const attName = itemAttributes.children[j].nodeName;
          if (!excluded[attName]) {
            attributes[attName] = attributes[itemAttributes.children[j].nodeName] || attributeCount++;
          }
        }
      }

      function fillAttributes(source) {
        return function() {
          const elements = item.getElementsByTagName(source);
          for (j = 0; j < elements.length; ++j) {
            attributes[elements[j].attributes[0].nodeValue] = attributes[elements[j].attributes[0].nodeValue] || attributeCount++;
          }
        };
      };

      fillAttributes("resistance")();
      fillAttributes("susceptibility")();
    }

    const table = ce("table");
    const thead = ce("thead");
    let tr = ce("tr");
    let td = ce("th");

    append(thead, table);
    append(tr, thead);

    td.textContent = "image";
    append(td, tr);

    td = cext("th", {
      textContent: "name"
    });
    td.classList.add("sortable");
    td.addEventListener("click", sortBy);
    append(td, tr);

    for (var i in attributes) {
      td = cext("th", {
          textContent: i
      });
      td.classList.add("sortable");
      append(td, tr);
      td.addEventListener("click", sortBy);
    }

    for (var i = 0; i < items.length; ++i) {
      const item = items[i];
      let unattainable = false;

      let itemAttributes = item.getElementsByTagName("attributes");
      let allAttributes = [];

      if (itemAttributes.length == 1) {
        itemAttributes = itemAttributes[0];
        for (j = 0; j < itemAttributes.children.length; ++j) {
          const child = itemAttributes.children[j];
          if (child.tagName === "unattainable") {
            unattainable = child.innerHTML === "true";
          }
          if (child.attributes.value) {
            allAttributes[attributes[child.nodeName]] = child.attributes.value.nodeValue;
          }
        }
      }

      if (unattainable) {
        console.log("unattainable item: " + item.attributes[0].value);
        continue;
      }

      let tr = ce("tr");
      let td = ce("td");
      append(td, tr);
      let type = item.getElementsByTagName("type")[0];

      const homepage = getHomeUrl(escape(type.attributes[0].nodeValue), escape(item.attributes[0].value));

      td.classList.add("sprite");
      const sprite = getImage(escape(type.attributes[0].nodeValue), escape(type.attributes[1].value));
      sprite.className = "listicon";
      append(sprite, td);

      td = ce("td");
      append(td, tr);
      append(cext("a", {
        href: homepage,
        target: "_blank",
        textContent: item.attributes[0].value
      }), td);

      append(tr, table);

      allAttributes = parseResistances(allAttributes, attributes, items[i], "resistance");
      allAttributes = parseResistances(allAttributes, attributes, items[i], "susceptibility");

      for (var j = 1; j <= attributeCount-1; ++j) {
        append(cext("td", {
          textContent: allAttributes[j] || ""
        }), tr);
      }
    }
    append(table, itemsDiv);
  } catch (e) {
    const errmsg = "Failed to fetch xml resource: " + url;
    console.error(errmsg, e);
    alert(errmsg);
  }
}

window.addEventListener("load", async function() {
  await fetchVersion();
  init();
});

})();
