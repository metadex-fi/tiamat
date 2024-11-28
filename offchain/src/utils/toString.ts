// // (function () {
// //   const originalToString = Object.prototype.toString;

// //   Object.prototype.toString = function () {
// //     if (this && typeof this === "object") {
// //       try {
// //         return `Object.toString: ${JSON.stringify(this)}`;
// //       } catch (e) {
// //         return `[[${e}]] Object.toString: ${originalToString.call(this)}`;
// //       }
// //       // throw new Error("Object coercion to string is not allowed!");
// //     }
// //     return originalToString.call(this);
// //   };
// // })();

// (function () {
//   const originalToString = Object.prototype.toString;

//   /**
//    *
//    */
//   Object.prototype.toString = function () {
//     if (this && typeof this === "object") {
//       try {
//         const jsonString = JSON.stringify(this);
//         const stackTrace = new Error().stack;
//         return `Object.toString: ${jsonString}\nStackTrace: ${stackTrace}`;
//       } catch (e) {
//         const stackTrace = new Error().stack;
//         return `[[${e}]] Object.toString: ${originalToString.call(
//           this,
//         )}\nStackTrace: ${stackTrace}`;
//       }
//     }
//     return originalToString.call(this);
//   };
// })();
