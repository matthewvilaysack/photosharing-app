/**
 * fetchModel - Fetch a model from the web server.
 *
 * @param {string} url      The URL to issue the GET request.
 *
 * @returns a Promise that should be filled with the response of the GET request
 * parsed as a JSON object and returned in the property named "data" of an
 * object. If the request has an error, the Promise should be rejected with an
 * object that contains the properties:
 * {number} status          The HTTP response status
 * {string} statusText      The statusText from the xhr request
 */
 function fetchModel(url) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var response = JSON.parse(xhr.responseText);
          resolve({ status: xhr.status, data: response });
        } catch (error) {
          reject({ status: xhr.status, statusText: "Invalid JSON" });
        }
      } else {
        reject({ status: xhr.status, statusText: xhr.statusText });
      }
    };
    xhr.onerror = function () {
      reject({ status: xhr.status, statusText: "Network error" });
    };
    xhr.send();
  });
}

export default fetchModel;
