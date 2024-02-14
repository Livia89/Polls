import { FastifyInstance } from 'fastify';
import { voting } from '../../utils/voting-pub-sub';
import z from 'zod';

export async function pollResults(app: FastifyInstance) {
	app.get(
		'/polls/:pollId/results',
		{ websocket: true },
		(connection, request) => {
			const pollIdParams = z.object({ pollId: z.string().uuid() });

			const { pollId } = pollIdParams.parse(request.params);
			// Inscrever apenas nas mensagens publicadas no canal com o ID da enquete (`pollId`)
			voting.subscribe(pollId, message => {
				connection.socket.send(JSON.stringify(message));
			});
		}
	);
}
