import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import BigNumber from "bignumber.js";
import erc20Abi from "../contract/erc20.abi.json";
import CeloCommAbi from "../contract/celoComm.abi.json";
require("arrive");

const ERC20_DECIMALS = 18;
const cUSDContractAddress = "0xb053651858F145b3127504C1045a1FEf8976BFfB";
const CeloCommContractAddressAbi = "0xc7109a3db117b3EE8b180e4f92Eae2e1Dc8e16E6";

let kit;
let contract;
let communities = [];

const connectCeloWallet = async function () {
  console.log("connecting celo");
  if (window.celo) {
    try {
      notification("⚠️ Please approve this DApp to connect to your wallet.");
      await window.celo.enable();
      notificationOff();
      const web3 = new Web3(window.celo);
      kit = newKitFromWeb3(web3);

      const accounts = await kit.web3.eth.getAccounts();
      kit.defaultAccount = accounts[0];

      contract = new kit.web3.eth.Contract(CeloCommAbi, CeloCommContractAddressAbi);
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.");
  }
};

async function approve(_price) {
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress);

  const result = await cUSDContract.methods
    .approve(CeloCommContractAddressAbi, _price)
    .send({ from: kit.defaultAccount });
  return result;
}

const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount);
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2);
  document.getElementById("balance").innerHTML = cUSDBalance;
  return cUSDBalance;
};

document.querySelector("#newCommunityBtn").addEventListener("click", async (e) => {
  const params = [
    document.getElementById("newName").value,
    document.getElementById("newImage").value,
    document.getElementById("newDescription").value,
  ];

  notification(`⌛ Adding "${params[0]}"...`);
  try {
    const result = await contract.methods
      .addCommunity(...params)
      .send({ from: kit.defaultAccount });
  } catch (error) {
    notification(`⚠️ ${error}.`);
  }
  notification(`🎉 You successfully added "${params[0]}".`);
  getCommunities();
});

async function supportCommunity(index) {
  const amount = new BigNumber(
    document.getElementById(`supportAmount${index}`).value
  )
    .shiftedBy(ERC20_DECIMALS)
    .toString();

  const params = [index, amount];

  notification("⌛ Waiting for payment approval...");
  try {
    await approve(amount);
  } catch (error) {
    notification(`⚠️ ${error}.`);
    console.log(error);
  }

  notification(`⌛ Awaiting payment for "${communities[index].name}"...`);

  try {
    const result = await contract.methods
      .addCommunity(...params)
      .send({ from: kit.defaultAccount });

    notification(`🎉 You successfully supported "${communities[index].name}".`);

    getCommunities();
    getBalance();
  } catch (error) {
    notification(`⚠️ ${error}.`);
  }
}

const getCommunities = async function () {
  const _communitiesCount = await contract.methods.getCommunityCount().call();
  const _communities = [];

  for (let i = 0; i < _communitiesCount; i++) {
    let _community = new Promise(async (resolve, reject) => {
      let community = await contract.methods.fetchCommunity(i).call();

      resolve({
        index: i,
        admin: community[0],
        name: community[1],
        image: community[2],
        description: community[3],
        raised: new BigNumber(community[4]),
        supporters: community[5],
      });
    });

    _communities.push(_community);
  }

  communities = await Promise.all(_communities);

  renderCommunities();
};

function renderCommunities() {
  document.getElementById("communityList").innerHTML = "";

  communities.forEach((_community) => {
    const newDiv = document.createElement("div");
    newDiv.className = "col-md-4";
    newDiv.innerHTML = `
          ${communityTemplate(_community)}        <div class="communityTemplates">
          </div>`;

    document.getElementById("communityList").appendChild(newDiv);
  });
}

function notification(_text) {
  document.querySelector(".alert").style.display = "block";
  document.querySelector("#notification").textContent = _text;
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none";
}

function communityTemplate(_community) {
  return `
    <div class="card mb-4 mx-2 imageTemplate" >
    <img class="card-img-top" src="${_community.image}" alt="...">
    <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
    ${_community.supporters} Supporters ⚓️
    </div>
      <div class="card-body text-left  position-relative">
        <div class="translate-middle-y position-absolute top-0">
        ${identiconTemplate(_community.admin)}
        </div>
        <h2 class="card-title fs-4 fw-bold mt-2">${_community.name}</h2>
        <p class="card-text " style="">
          Raised <b>${_community.raised
            .shiftedBy(-ERC20_DECIMALS)
            .toFixed(4)}</b>        
        </p>
        <p class="card-text mb-4" >
        by ${_community.admin}
        </p>

        <p class="card-text mb-4" >
       ${_community.description}
        </p>

        <button class="btn btn-lg btn-outline-dark bg-success fs-6 p-3" id=${
          _community.index
        }
          
          data-bs-toggle="modal"
          data-bs-target="#supportModal${_community.index}"
        >
          <b>Support</b> this
        </button>

        <!--Modal-->
        ${supportModal(_community.index)}
        <!--/Modal-->

      </div>
    </div>
  `;
}

let hasArrived = false;

window.addEventListener("load", async () => {
  document.arrive(".communityTemplates", () => {
    if (!hasArrived) {
      hasArrived = true;

      const supportBtns = document.querySelectorAll("button.supportBtn");

      supportBtns.forEach((supportBtn) => {
        supportBtn.addEventListener("click", async () => {
          const index = supportBtn.getAttribute("index-value");

          await supportImage(parseInt(index));
        });
      });
    }
  });
});

function supportModal(_index) {
  return `
    <div
      class="modal fade supportModal"
      id="supportModal${_index}"
      tabindex="-1"
      aria-labelledby="supportModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">

          <div class="modal-header">
            <h5 class="modal-title" id="supportModalLabel">Support</h5>
            <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <form>
              <div class="form-row">
                <div class="col">
                  <input
                    type="text"
                    id="supportAmount${_index}"
                    class="form-control mb-2 "
                    placeholder="Support in cUSD"
                  />
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-light border"
              data-bs-dismiss="modal"
            >
              Close
            </button>
            <button
              type="button"
              class="btn btn-dark supportBtn"
              data-bs-dismiss="modal"
              index-value="${_index}"
            >
              Thanks, Lets go! 🚀
            </button>
          </div>
        </div>
      </div>  
    </div>     
  `;
}

function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL();

  return `
  <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${_address}">
    </a>
  </div>
  `;
}

window.addEventListener("load", async () => {
  notification("⌛ Loading...");
  await connectCeloWallet();
  await getBalance();
  await getCommunities();
  notificationOff();
});
