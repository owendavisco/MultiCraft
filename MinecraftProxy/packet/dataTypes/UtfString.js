'use strict';

class UtfString {
    static readUtfString(byteArray, length) {
        let string = '';
        for(let byte of byteArray) {
            string += String.fromCharCode(97 + byte);
        }

        return string;
    }
}
