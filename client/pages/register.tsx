import { useState } from "react";
import Link from "next/link"; // Importa Link da Next.js
import React from "react";
// eslint-disable-next-line prettier/prettier
import { useRouter } from "next/router";
import "../src/app/css/Register.css";

const Register = () => {
  // Stato per i campi del form
  const [nome, setNome] = useState<string>("");
  const [cognome, setCognome] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validazione dei campi
    if (!nome || !cognome || !email || !password || !confirmPassword) {
      setError("Tutti i campi sono obbligatori.");
      setSuccess(null);
      return;
    }

    if (password !== confirmPassword) {
      setError("Le password non corrispondono.");
      setSuccess(null);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("L'email non è valida.");
      setSuccess(null);
      return;
    }

    setError(null); // Clear errors

    try {
      // Invio dei dati al server
      const response = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nome, cognome, email, password }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Errore durante la registrazione.");
      }

      const data = await response.json();
      setSuccess("Registrazione completata con successo! Benvenuto!");
      setNome("");
      setCognome("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      router.push("/homepage");
    } catch (err: any) {
      setError(err.message);
      setSuccess(null);
    }
  };

  return (
    <>
      <div className="main-container">
        <div className="container">
          <form onSubmit={handleSubmit} className="form">
            <h1>Registrazione</h1>
            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}

            <div className="input-group">
              <label htmlFor="nome">Nome</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="input"
              />
            </div>

            <div className="input-group">
              <label htmlFor="cognome">Cognome</label>
              <input
                type="text"
                id="cognome"
                name="cognome"
                value={cognome}
                onChange={(e) => setCognome(e.target.value)}
                className="input"
              />
            </div>

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Conferma Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
              />
            </div>

            <button type="submit" className="button">
              Registrati
            </button>

            <h6 className="link">
              Hai già un account?
              <Link href="/login">Accedi ora.</Link>
            </h6>
          </form>
        </div>
      </div>
    </>
  );
};

export default Register;
