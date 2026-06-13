import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "General", slug: "general", description: "General questions and requests", sortOrder: 1 },
  { name: "Bug Report", slug: "bug-report", description: "Something is broken", sortOrder: 2 },
  { name: "Feature Request", slug: "feature-request", description: "Suggest an improvement", sortOrder: 3 },
  { name: "Account", slug: "account", description: "Account and access issues", sortOrder: 4 },
  { name: "Billing", slug: "billing", description: "Billing and payments", sortOrder: 5 },
];

async function main() {
  const passwordHash = await bcrypt.hash("changeme", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ticketr.local" },
    update: {},
    create: {
      email: "admin@ticketr.local",
      fullName: "Admin User",
      passwordHash,
      role: UserRole.admin,
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: "agent@ticketr.local" },
    update: {},
    create: {
      email: "agent@ticketr.local",
      fullName: "Support Agent",
      passwordHash,
      role: UserRole.agent,
    },
  });

  await prisma.user.upsert({
    where: { email: "user@ticketr.local" },
    update: {},
    create: {
      email: "user@ticketr.local",
      fullName: "Demo User",
      passwordHash,
      role: UserRole.user,
    },
  });

  for (const category of categories) {
    await prisma.ticketCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  const generalCategory = await prisma.ticketCategory.findUnique({
    where: { slug: "general" },
  });

  if (generalCategory) {
    const existing = await prisma.ticket.findFirst({
      where: { subject: "Welcome to ticketr" },
    });

    if (!existing) {
      const demoUser = await prisma.user.findUnique({
        where: { email: "user@ticketr.local" },
      });

      if (demoUser) {
        await prisma.ticket.create({
          data: {
            subject: "Welcome to ticketr",
            description: "This is a sample ticket to help you explore the system.",
            categoryId: generalCategory.id,
            createdById: demoUser.id,
            assigneeId: agent.id,
            status: "open",
            messages: {
              create: [
                {
                  authorId: demoUser.id,
                  body: "Hi, I just signed up. How do I get started?",
                  isInternal: false,
                },
                {
                  authorId: agent.id,
                  body: "Welcome! Create a new ticket anytime from the dashboard.",
                  isInternal: false,
                },
              ],
            },
          },
        });
      }
    }
  }

  console.log("Seed complete");
  console.log("Admin: admin@ticketr.local / changeme");
  console.log("Agent: agent@ticketr.local / changeme");
  console.log("User:  user@ticketr.local / changeme");
  console.log("Admin id:", admin.id);

  const cannedResponses = [
    {
      title: "Thanks for reaching out",
      shortcut: "thanks",
      body: "Thanks for reaching out! We're looking into this and will get back to you shortly.",
    },
    {
      title: "Need more information",
      shortcut: "more-info",
      body: "Could you share a few more details or a screenshot? That will help us resolve this faster.",
    },
    {
      title: "Issue resolved",
      shortcut: "resolved",
      body: "This should be resolved now. Let us know if you run into anything else!",
    },
  ];

  for (const item of cannedResponses) {
    await prisma.cannedResponse.upsert({
      where: { shortcut: item.shortcut },
      update: { title: item.title, body: item.body },
      create: {
        title: item.title,
        body: item.body,
        shortcut: item.shortcut,
        createdById: admin.id,
        isGlobal: true,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
