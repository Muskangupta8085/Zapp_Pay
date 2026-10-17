import { z } from 'zod';

export const submitKycSchema = {
  body: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    dob: z.string().optional(),
    country: z.string().min(2, 'Country is required'),
    address: z.string().optional(),
    documents: z
      .array(
        z.object({
          docType: z.enum(['passport', 'national_id', 'driving_license']),
          documentNumber: z.string().min(1, 'Document number is required'),
          frontImageUrl: z.string().url('Invalid front image URL'),
          backImageUrl: z.string().url('Invalid back image URL').optional(),
        })
      )
      .min(1, 'At least one document is required'),
  }),
};
