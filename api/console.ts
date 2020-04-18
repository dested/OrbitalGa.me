import {prisma} from 'orbitalgame-server-common/build';

async function main() {
  await prisma.server.create({
    data: {
      live: true,
      serverId: 'abc123',
      serverUrl: '1',
    },
  });
}

main()
  .then(() => console.log('done'))
  .catch((e) => console.error(e));
