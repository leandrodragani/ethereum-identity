/* eslint-disable @next/next/no-img-element */
import React from "react";

import CeramicClient from "@ceramicnetwork/http-client";
import ThreeIdResolver from "@ceramicnetwork/3id-did-resolver";

import { EthereumAuthProvider, ThreeIdConnect } from "@3id/connect";
import { DID } from "dids";
import { IDX } from "@ceramicstudio/idx";

const endpoint = "https://ceramic-clay.3boxlabs.com";

export default function Home() {
  const [state, setState] = React.useState({
    name: "",
    image: "",
    loaded: false,
  });

  const { name, image, loaded } = state;

  async function connect() {
    const addresses = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    return addresses;
  }

  async function readProfile() {
    const [address] = await connect();
    const ceramic = new CeramicClient(endpoint);
    const idx = new IDX({ ceramic });

    try {
      const data = await idx.get("basicProfile", `${address}@eip155:1`);
      console.log(data);
      const { name, avatar } = data;
      setState({ ...state, name, image: avatar });
    } catch (error) {
      console.error(error);
      setState({ ...state, loaded: true });
    }
  }

  async function updateProfile() {
    const [address] = await connect();
    const ceramic = new CeramicClient(endpoint);
    const threeIdConnect = new ThreeIdConnect();
    const provider = new EthereumAuthProvider(window.ethereum, address);

    await threeIdConnect.connect(provider);

    const did = new DID({
      provider: threeIdConnect.getDidProvider(),
      resolver: {
        ...ThreeIdResolver.getResolver(ceramic),
      },
    });

    ceramic.setDID(did);
    await ceramic.did.authenticate();

    const idx = new IDX({ ceramic });

    await idx.set("basicProfile", { name, avatar: image });

    console.log(`Profile updated ${name} ${image}`);
  }

  return (
    <div>
      <div>
        <input
          placeholder="name"
          onChange={(e) => setState({ ...state, name: e.target.value })}
        />
        <input
          placeholder="profileImage"
          onChange={(e) => setState({ ...state, image: e.target.value })}
        />
        <button onClick={updateProfile}>Set profile</button>
      </div>
      <button onClick={readProfile}>Read profile</button>
      <div>
        {name ? <h1>{name}</h1> : null}
        {image ? <img src={image} style={{ width: 400 }} alt="avatar" /> : null}
        {!image && !name && loaded ? (
          <h4>No profile found, please create one...</h4>
        ) : null}
      </div>
    </div>
  );
}
