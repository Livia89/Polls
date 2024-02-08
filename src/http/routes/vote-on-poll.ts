import { randomUUID } from 'crypto';
import { prisma } from '../../lib/prisma';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export async function voteOnPoll(app: FastifyInstance) {
	app.post('/polls/:pollId/votes', async (request, reply) => {
		// adding validation
		const voteOnPollBody = z.object({
			pollOptionId: z.string().uuid(),
		});

		const voteOnPollParams = z.object({
			pollId: z.string(),
		});

		const { pollId } = voteOnPollParams.parse(request.params);
		const { pollOptionId } = voteOnPollBody.parse(request.body);

		let { sessionId } = request.cookies;

		if (sessionId) {
			const userPreviousVoteOnPoll = await prisma.vote.findUnique({
				where: {
					sessionId_pollId: {
						sessionId,
						pollId,
					},
				},
			});

			if (
				userPreviousVoteOnPoll &&
				userPreviousVoteOnPoll?.pollOptionId !== pollOptionId
			) {
				// deleting current vote
				const result = await prisma.vote.delete({
					where: {
						id: userPreviousVoteOnPoll.id,
					},
				});
			} else if (userPreviousVoteOnPoll) {
				return reply
					.code(401)
					.send({ message: 'You already voted on this poll' });
			}
		}

		if (!sessionId) {
			// Forbid multiple voting
			sessionId = randomUUID();

			reply.setCookie('sessionId', sessionId, {
				path: '/',
				maxAge: 60 * 60 * 24 * 30, // 30 days,
				signed: true, // assurance that the session was created by BE
				httpOnly: true, // access by BE only
			});
		}

		await prisma.vote.create({
			data: {
				sessionId,
				pollId,
				pollOptionId,
			},
		});

		return reply.status(201).send({ sessionId });
	});
}
