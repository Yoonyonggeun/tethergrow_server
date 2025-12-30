import $ from "jquery";

const XLSX = require("xlsx");

const excelDownloadBtn = document.getElementById("excel__download-btn");

if (excelDownloadBtn) {
  (() => {
    $(() => {
      function tableToSheet(table) {
        const data = [];
        const rows = table.querySelectorAll("tr");

        rows.forEach((row) => {
          const rowData = [];
          row.querySelectorAll("th, td").forEach((cell) => {
            rowData.push({ v: cell.textContent, t: "s" }); // 모든 셀을 문자열로 처리
          });
          data.push(rowData);
        });

        return XLSX.utils.aoa_to_sheet(data);
      }

      $("button#excel__download-btn").on("click", function () {
        const adminName = $(this).attr("name");
        const elt = document.getElementById("tableData");
        const ws = tableToSheet(elt);
        for (const cell in ws) {
          if (typeof ws[cell] === "object" && ws[cell].v !== undefined) {
            // 셀 값이 숫자 형태의 문자열인 경우 텍스트 형식으로 지정
            console.log(ws[cell].v);
            if (/^\d+$/.test(ws[cell].v.toString())) {
              ws[cell].t = "s"; // 't'를 's'(문자열)로 설정
              ws[cell].z = "@"; // 셀 형식을 텍스트(@)로 설정
            }
          }
        }
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `${adminName}_리스트`);
        XLSX.writeFile(wb, `${adminName}_리스트.xlsx`);
      });
    });
  })();
}
