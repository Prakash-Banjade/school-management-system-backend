import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function setupSwagger(app: INestApplication): void {
    const config = new DocumentBuilder()
        .setTitle('School Management System API')
        .setDescription('School Management System API description')
        .setVersion('1.0')
        .addTag('Authentication')
        .addTag('Students')
        .addServer(process.env.BACKEND_URL)
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'JWT',
                description: 'Enter JWT token',
                in: 'header',
            }
        )
        .build();

    const document = SwaggerModule.createDocument(app, config, {

    });

    SwaggerModule.setup('docs', app, document, {
        jsonDocumentUrl: 'docs/json',
        customSiteTitle: 'School Management System API',
        customfavIcon: 'https://avatars.githubusercontent.com/u/6936373?s=200&v=4',
        customJs: [
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.js',
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-standalone-preset.min.js',
        ],
        customCssUrl: [
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css',
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-standalone-preset.min.css',
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.css',
        ],

    });
}