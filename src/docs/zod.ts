// Central place that extends zod with the .openapi() helper. Every docs file
// imports `z` from HERE (not directly from 'zod') so the extension is applied
// before any top-level .openapi() call runs.
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export { z };
