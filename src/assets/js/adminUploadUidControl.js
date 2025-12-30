import $ from "jquery";
import moment from "moment-timezone";

const adminUidFormPage = document.getElementById("admin__uidForm-page");
const XLSX = require("xlsx");

if (adminUidFormPage) {
  (() => {
    $(() => {
      // 환율 입력 함수
      const changeCurrencyExchangeRate = (currency) => {
        $(`button#submit__${currency}`).on("click", () => {
          const exchangeRate = $(`input#${currency}`).val();
          const isConfirm = confirm(`1${currency.toUpperCase()} = ${exchangeRate}USDT로 설정하시겠습니까?`);
          if (!isConfirm) return;
          $.ajax({
            url: "/api/change-currency-exchange-rate",
            type: "POST",
            data: { currency, exchangeRate },
            success: (result) => {
              if (result.msg === "success") {
                window.location.reload();
              }
            },
            error: (err) => {
              alert(`오류가 발생했습니다:\r\n${JSON.stringify(err)}`);
            },
          });
        });
      };
      // BTC 환율 입력
      changeCurrencyExchangeRate("btc");
      // ETH 환율 입력
      changeCurrencyExchangeRate("eth");
      // MX 환율 입력
      changeCurrencyExchangeRate("mx");

      // @ BEGIN: 파일을 통한 UID 업로드(binance, bybit, bitget, bingx, mexc, gateio, bitmart)
      // 거래소별 UID 업로드
      const uploadUid = (exchange, uidCellTitle, commissionCellTitle, uidColumn, commissionColumn, commissionTime, registrationTime, commissionTimeColumn, registrationTimeColumn) => {
        $(`button#submit__${exchange}`).on("click", async function () {
          const isConfirm = confirm(`${exchange.toUpperCase()} UID 데이터를 업로드하시겠습니까?\n※ 업로드 후 수정이 불가능합니다.`);
          if (!isConfirm) return;

          // 거래소 데이터 ID
          const exchangeID = $(this).attr("data-id");

          // BTC 환율
          const btcExchangeRate = parseFloat($("#admin__uidForm-page").attr("data-btc"));

          // ETH 환율
          const ethExchangeRate = parseFloat($("#admin__uidForm-page").attr("data-eth"));

          // MX 환율
          const mxExchangeRate = parseFloat($("#admin__uidForm-page").attr("data-mx"));

          // 파일 선택여부 확인
          const file = $(`input#${exchange}`).val();
          if (!file) {
            alert("파일을 선택해주세요.");
            return;
          }
          // 파일 확장자 확인
          const allowedExtensions = ["xlsx", "csv"];
          const fileName = file.split("\\").pop();
          const fileExtension = file.split(".").pop().toLowerCase();
          if (!allowedExtensions.includes(fileExtension)) {
            $(`input#${exchange}`).val("");
            alert(".xlsx 또는 .csv 형식의 파일만 업로드 가능합니다.");
            return;
          }

          // 파일 읽기
          const data = await $(`input#${exchange}`)[0].files[0].arrayBuffer();
          const workbook = XLSX.read(data);
          const sheetNameList = workbook.SheetNames;
          const sheetElement = workbook.Sheets[sheetNameList[0]];

          // 파일 데이터 JSON 변환
          const exchangeJson = XLSX.utils.sheet_to_json(sheetElement, { raw: false });

          // 거래소별 파일 데이터 오류 검증
          if (!exchangeJson[0][`${uidCellTitle}`]) {
            alert(`파일 양식이 올바르지 않습니다. ${uidCellTitle}를 확인해주세요.`);
            return;
          }
          if (!exchangeJson[0][commissionCellTitle]) {
            alert(`파일 양식이 올바르지 않습니다. ${commissionCellTitle}를 확인해주세요.`);
            return;
          }
          let exchangeJsonError = false;

          const finalData = [];
          for (let i = 0; i < exchangeJson.length; i += 1) {
            if (!exchangeJson[i][`${uidCellTitle}`]) {
              exchangeJsonError = true;
              alert(`${uidColumn}${i + 2}셀의 UID 값이 없습니다.`);
              break;
            }
            if (exchange === "bitmart") {
              // @ Bitmart의 경우 커미션 값이 없는 경우 BTC 또는 ETH로 계산
              if (exchangeJson[i]["Commission(BTC)"] !== "0") {
                exchangeJson[i][commissionCellTitle] = `${exchangeJson[i]["Commission(BTC)"] * btcExchangeRate}`;
              } else if (exchangeJson[i]["Commission(ETH)"] !== "0") {
                exchangeJson[i][commissionCellTitle] = `${exchangeJson[i]["Commission(ETH)"] * ethExchangeRate}`;
              }
            } else if (exchange === "mexc") {
              // @ MEXC의 경우 환율 계산 필요
              if (exchangeJson[i]["커미션 토큰"] === "BTC") {
                exchangeJson[i][commissionCellTitle] = `${exchangeJson[i][commissionCellTitle] * btcExchangeRate}`;
              } else if (exchangeJson[i]["커미션 토큰"] === "ETH") {
                exchangeJson[i][commissionCellTitle] = `${exchangeJson[i][commissionCellTitle] * ethExchangeRate}`;
              } else if (exchangeJson[i]["커미션 토큰"] === "MX") {
                exchangeJson[i][commissionCellTitle] = `${exchangeJson[i][commissionCellTitle] * mxExchangeRate}`;
              }
            } else if (exchange === "bybit" || exchange === "bitget" || exchange === "bingx" || exchange === "bitmart") {
              // @ Bybit, Bitget, BingX, Bitmart의 경우 커미션 값이 없는 경우 0으로 처리
              if (!exchangeJson[i][commissionCellTitle]) {
                exchangeJson[i][commissionCellTitle] = "0";
              }
            }
            finalData.push({
              uid: exchangeJson[i][`${uidCellTitle}`],
              commission: exchangeJson[i][commissionCellTitle],
            });
          }
          if (exchangeJsonError) return;

          // 데이터 등록
          $.ajax({
            url: "/api/upload-uid",
            type: "POST",
            data: { fileName, exchangeID, data: JSON.stringify(finalData) },
            success: (result) => {
              if (result.msg === "success") {
                alert("업로드가 완료되었습니다.");
                window.location.reload();
              } else if (result.msg === "error") {
                alert("알 수 없는 오류로 인해 데이터가 업로드 되지 않았습니다.\n개발자에게 문의해주세요.");
              }
            },
            error: (err) => {
              alert(`오류가 발생했습니다:\r\n${JSON.stringify(err)}`);
            },
          });
        });
      };

      // Bybit UID 업로드
      uploadUid("bybit", "UID", "Commissions", "A", "M");
      // Bitget UID 업로드
      uploadUid("bitget", "Referred User UID", "Total commission(maker/taker)", "B", "C");
      // BingX UID 업로드
      uploadUid("bingx", "UID", "Your Commission (USDT)", "A", "K");
      // Bitmart UID 업로드
      uploadUid("bitmart", "User ID", "Commission(USDT)", "A", "C");
      // HTX UID 업로드
      uploadUid("htx", "UID", "Rewards(USDT)", "A", "F");
      // MEXC UID 업로드
      uploadUid("mexc", "출처", "나의 커미션", "B", "K");
      // @ END: 파일을 통한 UID 업로드(binance, bybit, bitget, bingx, mexc, gateio, bitmart)

      // @ BEGIN: API 실행 전 UID 수동 입력(okx)
      const execManualInputUid = (exchange) => {
        $(`button#submit__${exchange}Uid`).on("click", async function () {
          const isConfirm = confirm(`UID를 등록하시겠습니까?\n※ 업로드 후 수정이 불가능합니다.`);
          if (!isConfirm) return;

          const exchangeID = $(this).attr("data-id");
          const uid = $(`input#${exchange}Uid`).val();

          $.ajax({
            url: "/api/manual-upload-uid",
            type: "POST",
            data: { exchangeID, uid },
            success: (result) => {
              if (result.msg === "success") {
                alert("신규 가입자 UID 등록이 완료되었습니다.");
                const uidLiHTML = `<li class="uploaded__uid-item">${result.uidData.uid}</li>`;
                $(`#uploaded__uid-items-${exchange}`).prepend(uidLiHTML);
                $(`input#${exchange}Uid`).val("").trigger("focus");
              } else if (result.msg === "alreadyExist") {
                alert("이미 등록된 UID입니다.");
              }
            },
            error: (err) => {
              alert(`오류가 발생했습니다:\r\n${JSON.stringify(err)}`);
            },
          });
        });
      };

      // 업로드 취소 버튼 클릭 시
      $("button.cancel__upload-btn").each((i, elem) => {
        $(elem).on("click", function () {
          const isConfirm = confirm("업로드 취소를 진행하시겠습니까?");
          if (!isConfirm) return;
          const exchangeID = $(this).attr("data-id");
          $.ajax({
            url: "/api/cancel-upload-uid",
            type: "POST",
            data: { exchangeID },
            success: (result) => {
              if (result.msg === "success") {
                alert("업로드 취소가 완료되었습니다.");
                window.location.reload();
              }
            },
            error: (err) => {
              alert(`오류가 발생했습니다:\r\n${JSON.stringify(err)}`);
            },
          });
        });
      });

      // OKX UID 수동 입력
      execManualInputUid("okx");
      // @ END: API 실행 전 UID 수동 입력(okx)

      // @ BEGIN: API 실행을 통한 UID 업로드(okx)
      // API 실행을 통한 UID 업로드
      const execApiUploadUid = (exchange) => {
        $(`button#submit__${exchange}-api`).on("click", async function () {
          const isConfirm = confirm(`${exchange} API를 실행하시겠습니까?\n※ 업로드 후 수정이 불가능합니다.`);
          if (!isConfirm) return;

          $("p#loading__desc").text("API 실행 중입니다...");
          $("#admin__loading").addClass("active");
          const exchangeID = $(this).attr("data-id");

          $.ajax({
            url: "/api/okx-api-upload-uid",
            type: "POST",
            data: { exchangeID },
            success: (result) => {
              if (result.msg === "success") {
                alert("API 실행 및 UID 업로드가 완료되었습니다.");
              } else if (result.msg === "error") {
                alert("알 수 없는 오류로 인해 데이터가 업로드 되지 않았습니다.\n개발자에게 문의해주세요.");
              }
              window.location.reload();
            },
            error: (err) => {
              alert(`오류가 발생했습니다:\r\n${JSON.stringify(err)}`);
            },
          });
        });
      };

      // OKX API 실행
      execApiUploadUid("okx");
      // @ END: API 실행을 통한 UID 업로드(okx)
    });
  })();
}
