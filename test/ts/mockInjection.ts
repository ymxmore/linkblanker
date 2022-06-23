import MemoryPreferenceRepository from '@/interface/gateway/memory/repository/memoryPreferenceRepository';
import { container } from 'tsyringe';

container.register('LocalStoragePreferenceRepository', {
  useFactory: () => new MemoryPreferenceRepository(),
});

container.register('PreferenceRepository', {
  useFactory: () => new MemoryPreferenceRepository(),
});

export default container;
