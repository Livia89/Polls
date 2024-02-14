import { prisma } from '../../lib/prisma';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { redis } from '../../lib/redis';

export async function getPoll(app: FastifyInstance) {
	app.get('/polls/:pollId', async (request, reply) => {
		// adding validation
		const getPollParams = z.object({
			pollId: z.string().uuid(),
		});

		const { pollId } = getPollParams.parse(request.params);

		// saving data in database
		const poll = await prisma.poll.findUnique({
			where: { id: pollId },
			include: {
				options: {
					select: {
						id: true,
						title: true,
					},
				},
			},
		});

		if (!poll) return reply.code(400).send({ message: 'Poll not found' });
		// getting votes range, starting 0 until -1 position | WITHSCORES returns the pontuation
		const result = await redis.zrange(pollId, 0, -1, 'WITHSCORES');

		// pollOptionId: vote
		const votes = result.reduce((obj, line, index) => {
			if (index % 2 === 0) {
				const score = result[index + 1];
				Object.assign(obj, { [line]: Number(score) });
			}

			return obj;
		}, {} as Record<string, number>);

		return reply.send({
			poll: {
				id: poll.id,
				title: poll.title,
				options: poll.options.map(option => {
					return {
						id: option.id,
						title: option.title,
						score: option.id in votes ? votes[option.id] : 0,
					};
				}),
			},
		});
	});
}
