import { prisma } from '../../lib/prisma';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export async function createPoll(app: FastifyInstance) {
	app.post('/polls', async (request, reply) => {
		// adding validation
		const createPollBody = z.object({
			title: z.string(),
			options: z.array(z.string()),
		});

		const { title, options } = createPollBody.parse(request.body);

		// saving data in database
		const poll = await prisma.poll.create({
			data: {
				title,
				// adding multiple options and populate PollOptions because relation between tables
				options: {
					createMany: {
						data: options.map(option => {
							return {
								title: option,
							};
						}),
					},
				},
			},
		});

		return reply.status(201).send({ pollId: poll.id });
	});
}
