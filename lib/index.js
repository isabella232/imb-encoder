// jshint ignore: start
// jscs:disable
// USPS "Intelligent Mail Barcode" Decoder
// You may use this code for any purpose, with no restrictions. However,
// there is NO WARRANTY for this code; use it at your own risk. This work
// is released under the Creative Commons Zero License. To view a copy of
// this license, visit http://creativecommons.org/publicdomain/zero/1.0/

// barcode-to-bit permutation
var desc_char = [7,1,9,5,8,0,2,4,6,3,5,8,9,7,3,0,6,1,7,4,6,8,9,2,5,1,7,5,4,3,
8,7,6,0,2,5,4,9,3,0,1,6,8,2,0,4,5,9,6,7,5,2,6,3,8,5,1,9,8,7,4,0,2,6,3];
var desc_bit = [4,1024,4096,32,512,2,32,16,8,512,2048,32,1024,2,64,8,16,2,
1024,1,4,2048,256,64,2,4096,8,256,64,16,16,2048,1,64,2,512,2048,32,8,128,8,
1024,128,2048,256,4,1024,8,32,256,1,8,4096,2048,256,16,32,2,8,1,128,4096,512,
256,1024];
var asc_char = [4,0,2,6,3,5,1,9,8,7,1,2,0,6,4,8,2,9,5,3,0,1,3,7,4,6,8,9,2,0,5,
1,9,4,3,8,6,7,1,2,4,3,9,5,7,8,3,0,2,1,4,0,9,1,7,0,2,4,6,3,7,1,9,5,8];
var asc_bit = [8,1,256,2048,2,4096,256,2048,1024,64,16,4096,4,128,512,64,128,
512,4,256,16,1,4096,128,1024,512,1,128,1024,32,128,512,64,256,4,4096,2,16,4,1,
2,32,16,64,4096,2,1,512,16,128,32,1024,4,64,512,2048,4,4096,64,128,32,2048,1,
8,4];

// build tables of 13-bit codewords
var encode_table = new Array(1365);
var decode_table = new Array(8192);
var fcs_table = new Array(8192);
function build_codewords(bits, low, hi) {
  var fwd, rev, pop, tmp, bit;
  // loop through all possible 13-bit codewords
  for (fwd = 0; fwd < 8192; fwd++) {
    // build reversed codeword and count population of 1-bits
    pop = 0;
    rev = 0;
    tmp = fwd;
    for (bit = 0; bit < 13; bit++) {
      pop += tmp & 1;
      rev = (rev << 1) | (tmp & 1);
      tmp >>= 1;
    }
    if (pop != bits) continue;

    if (fwd == rev) {
      // palindromic codes go at the end of the table
      encode_table[hi] = fwd;
      decode_table[fwd] = hi;
      decode_table[fwd ^ 8191] = hi;
      fcs_table[fwd] = 0;
      fcs_table[fwd ^ 8191] = 1;
      hi--;
    }
    else if (fwd < rev) {
      // add foreward code to front of table
      encode_table[low] = fwd;
      decode_table[fwd] = low;
      decode_table[fwd ^ 8191] = low;
      fcs_table[fwd] = 0;
      fcs_table[fwd ^ 8191] = 1;
      low++;

      // add reversed code to front of table
      encode_table[low] = rev;
      decode_table[rev] = low;
      decode_table[rev ^ 8191] = low;
      fcs_table[rev] = 0;
      fcs_table[rev ^ 8191] = 1;
      low++;
    }
  }
}
build_codewords(5,    0, 1286);
build_codewords(2, 1287, 1364);

function add(num, add) {
  // num is an array of 11-bit words representing a multiple-precision number.
  // add "add" to num.
  var n, x;
  for (n = num.length - 1; n >= 0 && add != 0; n--) {
    x = num[n] + add;
    add = x >> 11;
    num[n] = x & 0x7ff;
  }
}

function muladd(num, mult, add) {
  // num is an array of 11-bit words representing a multiple-precision number.
  // multiply num by "mult" and add "add".
  // assuming 32-bit integers, the largest mult can be without overflowing
  // is about 2**20, approximately one million.
  var n, x;
  for (n = num.length - 1; n >= 0; n--) {
    x = num[n]*mult + add;
    add = x >> 11;
    num[n] = x & 0x7ff;
  }
}

function divmod(num, div) {
  // num is an array of 11-bit words representing a multiple-precision number.
  // divide num by "div" and return remainder.
  // div is limited the same way as mult above.
  var mod = 0;
  var n, x, q, len = num.length;
  for (n = 0; n < len; n++) {
    x = num[n] + (mod << 11);
    num[n] = q = Math.floor(x / div);
    mod = x - q*div;
  }
  return mod;
}

function calcfcs(num) {
  // calculate 11-bit frame check sequence for an array of 11-bit words.
  var fcs = 0x1f0;
  var n, bit, len = num.length;
  for (n = 0; n < len; n++) {
    fcs ^= num[n];
    for (bit = 0; bit < 11; bit++) {
      fcs <<= 1;
      if (fcs & 0x800) fcs ^= 0xf35;
    }
  }
  return fcs;
}

function chars_to_text(chars) {
  var barcode = "";
  for (n = 0; n < 65; n++) {
    if (chars[desc_char[n]] & desc_bit[n]) {
      if (chars[asc_char[n]] & asc_bit[n])
        barcode += "F";
      else
        barcode += "D";
    }
    else {
      if (chars[asc_char[n]] & asc_bit[n])
        barcode += "A";
      else
        barcode += "T";
    }
  }
  return barcode;
}

/* istanbul ignore next */
function encode_fields(inf) {
  var n;
  var num = [0,0,0,0,0,0,0,0,0,0];
  var marker = 0;
  if (inf.zip != "") {
    num[9] = parseInt(inf.zip,10);
    marker += 1;
  }
  if (inf.plus4 != "") {
    muladd(num, 10000, parseInt(inf.plus4,10));
    marker += 100000;
  }
  if (inf.delivery_pt != "") {
    muladd(num, 100, parseInt(inf.delivery_pt,10));
    marker += 1000000000;
  }
  add(num, marker);

  muladd(num, 10, parseInt(inf.barcode_id.charAt(0),10));
  muladd(num, 5, parseInt(inf.barcode_id.charAt(1),10));
  muladd(num, 1000, parseInt(inf.service_type,10));
  if (inf.mailer_id.length == 6) {
    muladd(num, 1000000, parseInt(inf.mailer_id,10));
    muladd(num, 100000, 0);  // multiply in two steps to avoid overflow
    muladd(num, 10000, parseInt(inf.serial_num,10));
  }
  else {
    muladd(num, 10000, 0);
    muladd(num, 100000, parseInt(inf.mailer_id,10));
    muladd(num, 1000000, parseInt(inf.serial_num,10));
  }

  var fcs = calcfcs(num);

  var cw = new Array(10);
  cw[9] = divmod(num, 636) << 1;
  for (n = 8; n > 0; n--)
    cw[n] = divmod(num, 1365);
  cw[0] = (num[8]<<11) | num[9];
  if (fcs & (1 << 10)) cw[0] += 659;

  var chars = new Array(10);
  for (n = 0; n < 10; n++) {
    chars[n] = encode_table[cw[n]];
    if (fcs & (1 << n)) chars[n] ^= 8191;
  }

  return chars_to_text(chars);
}

var barcode_fields = [ "zip", "plus4", "delivery_pt", "barcode_id",
   "service_type", "mailer_id", "serial_num" ];

/**
  * Take in a tracking number, parse and encode
  * @author Peter Nagel
  * @param {String} trackingNumber
  * @return {String} encoded for barcode font
  */
module.exports.encodeTrackingNumber = function (trackingNumber) {
  return encode_fields({
    barcode_id: trackingNumber.substr(0, 2),
    service_type: trackingNumber.substr(2, 3),
    mailer_id: trackingNumber.substr(5, 9),
    serial_num: trackingNumber.substr(14, 6),
    zip: trackingNumber.substr(20, 5),
    plus4: trackingNumber.substr(25, 4),
    delivery_pt: trackingNumber.substr(29, 2)
  });
}
