import { Service } from "encore.dev/service";
import { secret } from "encore.dev/config";

const openAIKeySecret = secret("OpenAIKey");

export const openAIKey = () => openAIKeySecret();

export default new Service("hub");