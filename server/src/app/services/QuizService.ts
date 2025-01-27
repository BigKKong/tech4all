import { QuizDao } from "../dao/QuizDao";
import { DomandaDao } from "../dao/DomandaDao";
import { RispostaDao } from "../dao/RispostaDao";
import { Quiz } from "../entity/gestione_quiz/Quiz";
import { Domanda } from "../entity/gestione_quiz/Domanda";
import { Risposta } from "../entity/gestione_quiz/Risposta";
import { SvolgimentoDao } from "../dao/SvolgimentoDao";
import { Svolgimento } from "../entity/gestione_quiz/Svolgimento";
import { Utente } from "../entity/gestione_autenticazione/Utente";
import { UtenteDao } from "../dao/UtenteDao";

export class QuizService {
  private quizDao: QuizDao;
  private domandaDao: DomandaDao;
  private rispostaDao: RispostaDao;
  private svolgimentoDao: SvolgimentoDao;
  private utenteDao: UtenteDao;

  constructor() {
    this.quizDao = new QuizDao();
    this.domandaDao = new DomandaDao();
    this.rispostaDao = new RispostaDao();
    this.utenteDao = new UtenteDao();
    this.svolgimentoDao = new SvolgimentoDao(this.quizDao, this.utenteDao);
  }
  async creaQuiz(quiz: Quiz): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Validazione delle domande
      for (const domanda of quiz.getDomande()) {
        if (domanda.getDomanda().length < 2) {
          return {
            success: false,
            message:
              "La lunghezza della domanda non è valida (minimo 2 caratteri).",
          };
        }
        if (domanda.getDomanda().length > 255) {
          return {
            success: false,
            message:
              "La lunghezza della domanda non è valida (massimo 255 caratteri).",
          };
        }
        for (const risposta of domanda.getRisposte()) {
          const testoRisposta = risposta.getRisposta();
          if (testoRisposta.length < 2) {
            return {
              success: false,
              message:
                "La lunghezza della risposta non è valida (minimo 2 caratteri).",
            };
          }
          if (testoRisposta.length > 255) {
            return {
              success: false,
              message:
                "La lunghezza della risposta non è valida (massimo 255 caratteri).",
            };
          }
        }
      }

      // 2. Creazione del quiz
      await this.quizDao.createQuiz(quiz);

      // 3. Creazione delle domande associate al quiz
      for (const domanda of quiz.getDomande()) {
        await this.domandaDao.createDomanda(domanda, quiz.getId());

        // 4. Creazione delle risposte per ogni domanda
        for (const risposta of domanda.getRisposte()) {
          await this.rispostaDao.createRisposta(risposta, domanda.getId());
        }
      }

      return {
        success: true,
        message: "Quiz creato con successo con tutte le domande e risposte.",
      };
    } catch (error) {
      console.error("Errore durante la creazione del quiz:", error);
      return {
        success: false,
        message: "Errore interno del server. Riprova più tardi.",
      };
    }
  }

  // Eliminazione di un quiz (e relative domande e risposte)
  async eliminaQuiz(
    id: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const quiz = await this.quizDao.getQuizById(id);
      if (!quiz) {
        return {
          success: false,
          message: "Quiz non trovato.",
        };
      }

      // 1. Eliminare le risposte associate a tutte le domande del quiz
      const domande = await this.domandaDao.getAllDomande();
      for (const domanda of domande) {
        if (domanda.getQuizId() === id) {
          const risposte = domanda.getRisposte();
          for (const risposta of risposte) {
            await this.rispostaDao.deleteRisposta(risposta.getId()!);
          }
          // 2. Eliminare le domande del quiz
          await this.domandaDao.deleteDomanda(domanda.getId()!);
        }
      }

      // 3. Eliminare il quiz
      await this.quizDao.deleteQuiz(id);

      return {
        success: true,
        message: "Quiz e relative domande e risposte eliminati con successo.",
      };
    } catch (error) {
      console.error("Errore durante l'eliminazione del quiz:", error);
      return {
        success: false,
        message: "Errore interno del server. Riprova più tardi.",
      };
    }
  }

  // Esecuzione del quiz (per un utente specifico)
  async eseguiQuiz(
    quizId: number,
    utenteId: number,
    risposteFornite: number[], // Lista di ID delle risposte scelte dall'utente
  ): Promise<{ success: boolean; message: string; esito: boolean }> {
    if (!utenteId || utenteId <= 0) {
      console.error("ID utente non valido");
      throw new Error("ID utente non valido");
    }
    if (!quizId || quizId <= 0) {
      console.error("ID quiz non valido");
      throw new Error("Quiz non trovato");
    }
    try {
      const quiz = await this.quizDao.getQuizById(quizId);
      if (!quiz) {
        return {
          success: false,
          message: "Quiz non trovato.",
          esito: false,
        };
      }

      // Recupero delle domande associate al quiz
      const domande = quiz.getDomande();

      // Calcolare le risposte corrette
      let risposteEsatte = 0;
      for (let i = 0; i < domande.length; i++) {
        const domanda = domande[i];
        const rispostaCorretta = domanda
          .getRisposte()
          .find((risposta) => risposta.getCorretta());

        // Controlla se la risposta fornita dall'utente è corretta
        if (
          rispostaCorretta &&
          rispostaCorretta.getId() === risposteFornite[i]
        ) {
          risposteEsatte++;
        }
      }

      // Determina se il quiz è stato superato (ad esempio, almeno 70% di risposte corrette)
      const esito = risposteEsatte / domande.length >= 0.7;

      // Recupera l'utente dall'utenteId
      const utente = await this.utenteDao.getUtenteById(utenteId);
      if (!utente) {
        return {
          success: false,
          message: "Utente non trovato.",
          esito: false,
        };
      }

      // Verifica se esiste già uno svolgimento per questo quiz e utente
      let svolgimento = await this.svolgimentoDao.getSvolgimento(
        quizId,
        utenteId,
      );

      if (svolgimento) {
        // Verifica se il quiz è già stato superato
        if (!svolgimento.getEsito()) {
          // Aggiorna lo svolgimento esistente solo se non è stato superato
          svolgimento.setEsito(esito);
          svolgimento.setDataConseguimento(new Date());
          svolgimento.setRisposteEsatte(risposteEsatte);
          await this.svolgimentoDao.updateSvolgimento(svolgimento);

          if (esito) {
            utente.setQuizSuperati(utente.getQuizSuperati() + 1);
            await this.utenteDao.updateQuizSuperati(utente);
          }
        }
      } else {
        // Crea un nuovo svolgimento
        svolgimento = new Svolgimento(
          quiz,
          utente,
          esito,
          new Date(),
          risposteEsatte,
        );
        await this.svolgimentoDao.createSvolgimento(svolgimento);

        if (esito) {
          utente.setQuizSuperati(utente.getQuizSuperati() + 1);
          await this.utenteDao.updateQuizSuperati(utente);
        }
      }

      return {
        success: true,
        message: "Quiz eseguito con successo.",
        esito: esito,
      };
    } catch (error) {
      console.error("Errore durante l'esecuzione del quiz:", error);
      return {
        success: false,
        message: "Errore durante l'esecuzione del quiz.",
        esito: false,
      };
    }
  }

  // recupera quiz per tutorial id
  async getQuizByTutorialId(
    tutorialId: number | null | undefined,
  ): Promise<Quiz> {
    if (tutorialId === null || tutorialId === undefined || tutorialId <= 0) {
      console.error("ID tutorial obbligatorio");
      throw new Error("ID tutorial obbligatorio");
    }
    try {
      const quiz = await this.quizDao.getQuizByTutorialId(tutorialId);

      if (!quiz) {
        throw new Error("Quiz non trovato"); // Lancia un errore se il quiz non esiste
      }

      const domande = quiz.getDomande().map((domanda) => {
        const risposte = domanda
          .getRisposte()
          .map(
            (risposta) =>
              new Risposta(
                risposta.getRisposta(),
                risposta.getCorretta(),
                risposta.getDomandaId(),
                risposta.getId(),
              ),
          );
        return new Domanda(
          domanda.getDomanda(),
          risposte,
          domanda.getQuizId(),
          domanda.getId(),
        );
      });

      quiz.setDomande(domande);
      return quiz;
    } catch (error) {
      // Gestione degli errori più esplicita
      console.error(
        "Errore durante il recupero del quiz:",
        error instanceof Error ? error.message : error,
      );
      throw new Error("Impossibile recuperare il quiz"); // Lancia un errore generico al chiamante
    }
  }
}
