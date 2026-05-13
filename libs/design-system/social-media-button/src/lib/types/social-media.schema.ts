import * as z from 'zod';

/** Schema for social media item */
export const SocialMediaSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    link: z.string(),
  })
  .meta({ id: 'SocialMedia' });

/** Social media item */
export type SocialMedia = z.infer<typeof SocialMediaSchema>;

/** Schema for social media items */
export const SocialsSchema = z
  .object({
    $schema: z.string(),
    socials: SocialMediaSchema.array(),
  })
  .meta({ id: 'Socials' });

export default SocialsSchema;

/** Social media items */
export type Socials = z.infer<typeof SocialsSchema>;
