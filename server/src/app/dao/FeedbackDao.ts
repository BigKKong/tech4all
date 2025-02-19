import { FieldPacket, Pool, RowDataPacket } from "mysql2/promise";
import { Feedback } from "../entity/gestione_feedback/Feedback";
import pool from "../../db"; // Importa il file di connessione al database

export class FeedbackDao {
  private db: Pool;

  constructor() {
    this.db = pool; // Utilizza il modulo di connessione al database
  }

  // Metodo per ottenere tutti i feedback
  public async getAllFeedback(): Promise<Feedback[]> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      //aggiunta tipo RowDataPacket[] per evitare il problema di any nel map
      "SELECT * FROM feedback",
    );
    return rows.map(
      (row: RowDataPacket) =>
        new Feedback(
          row.valutazione,
          row.commento,
          row.utente_id,
          row.tutorial_id,
        ),
    );
  }

  // Metodo per ottenere un feedback specifico per utente e tutorial
  public async getFeedback(
    utenteId: number,
    tutorialId: number,
  ): Promise<Feedback | null> {
    const [rows]: [RowDataPacket[], FieldPacket[]] = await this.db.query(
      "SELECT * FROM feedback WHERE utente_id = ? AND tutorial_id = ?",
      [utenteId, tutorialId],
    );
    if (rows.length > 0) {
      const row = rows[0];
      return new Feedback(
        row.valutazione,
        row.commento,
        row.utente_id,
        row.tutorial_id,
      );
    }
    return null;
  }

  // Metodo per creare un nuovo feedback
  public async createFeedback(feedback: Feedback): Promise<void> {
    const valutazione = feedback.getValutazione();
    const commento = feedback.getCommento();
    const idUtente = feedback.getUtenteId();
    const idTutorial = feedback.getTutorialId();
    await this.db.query(
      "INSERT INTO feedback (valutazione, commento, utente_id, tutorial_id) VALUES (?, ?, ?, ?)",
      [valutazione, commento, idUtente, idTutorial],
    );
  }

  // Metodo per eliminare un feedback per utente e tutorial
  public async deleteFeedback(
    userId: number,
    tutorialId: number,
  ): Promise<void> {
    await this.db.query(
      "DELETE FROM feedback WHERE utente_id = ? AND tutorial_id = ?",
      [userId, tutorialId],
    );
  }

  //Metodo per trovare un feedback tramite l'id dell'utente

  public async getFeedbackByUserId(userId: number): Promise<Feedback[]> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      "SELECT * FROM feedback WHERE utente_id = ?",
      [userId],
    );
    return rows.map(
      (row: RowDataPacket) =>
        new Feedback(
          row.valutazione,
          row.commento,
          row.utente_id,
          row.tutorial_id,
        ),
    );
  }
  //Metodo per trovare un feedback tramite l'id del tutorial
  public async getFeedbackByTutorialId(
    tutorialId: number,
  ): Promise<Feedback[]> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      "SELECT * FROM feedback WHERE tutorial_id = ?",
      [tutorialId],
    );
    return rows.map(
      (row: RowDataPacket) =>
        new Feedback(
          row.valutazione,
          row.commento,
          row.utente_id,
          row.tutorial_id,
        ),
    );
  }
  //Get Feedback da utente id e tutorialId getFeedbackByUserIdAndTutorialId
  public async getFeedbackByUserIdAndTutorialId(
    userId: number,
    tutorialId: number,
  ): Promise<Feedback | null> {
    const [rows]: [RowDataPacket[], FieldPacket[]] = await this.db.query(
      "SELECT * FROM feedback WHERE utente_id = ? AND tutorial_id = ?",
      [userId, tutorialId],
    );
    if (rows.length > 0) {
      const row = rows[0];
      return new Feedback(
        row.valutazione,
        row.commento,
        row.utente_id,
        row.tutorial_id,
      );
    }
    return null;
  }
}
