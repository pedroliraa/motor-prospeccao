import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import path from 'path';
import { rm } from 'fs/promises';

let sock: any = null;
let qrCodeBase64: string | null = null;
let status: 'desconectado' | 'aguardando_qr' | 'conectado' = 'desconectado';

export function getStatus() {
  return { status, qrCode: qrCodeBase64 };
}

export async function iniciarWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(
    path.resolve('whatsapp-auth')
  );

  sock = makeWASocket({
    auth: state,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update: any) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCodeBase64 = await QRCode.toDataURL(qr);
      status = 'aguardando_qr';
      console.log('QR Code gerado');
    }

    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      status = 'desconectado';
      qrCodeBase64 = null;
      if (shouldReconnect) iniciarWhatsApp();
    }

    if (connection === 'open') {
      status = 'conectado';
      qrCodeBase64 = null;
      console.log('WhatsApp conectado!');
    }
  });
}

export async function verificarWhatsApp(telefone: string): Promise<boolean> {
  if (!sock || status !== 'conectado') return false;
  try {
    const numero = `55${telefone.replace(/\D/g, '')}@s.whatsapp.net`;
    const [result] = await sock.onWhatsApp(numero);
    return result?.exists ?? false;
  } catch {
    return false;
  }
}

export async function desconectarWhatsApp() {
  try {
    await sock?.logout();
  } catch { }
  sock = null;
  status = 'desconectado';
  qrCodeBase64 = null;

  await new Promise(r => setTimeout(r, 500));

  try {
    await rm(path.resolve('whatsapp-auth'), { recursive: true, force: true });
    console.log('Pasta whatsapp-auth removida');
  } catch (err) {
    console.error('Erro ao remover whatsapp-auth:', err);
  }
}