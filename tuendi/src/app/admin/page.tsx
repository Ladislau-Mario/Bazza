import { Login } from "@/components/UI/Login";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Baza | Admin Login" }

export default function LoginPage(){
    return(
      <Login />
    );
}