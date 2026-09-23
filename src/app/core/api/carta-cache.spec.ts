import { EntradaCache, leerConCache } from './carta-cache';

describe('leerConCache()', () => {
  it('llama a cargar() la primera vez y guarda el resultado', async () => {
    const cache = new Map<string, EntradaCache<string>>();
    const cargar = vi.fn().mockResolvedValue('valor-1');

    const resultado = await leerConCache(cache, 'clave', 1000, cargar, () => 0);

    expect(resultado).toBe('valor-1');
    expect(cargar).toHaveBeenCalledTimes(1);
    expect(cache.get('clave')).toEqual({ valor: 'valor-1', timestampMs: 0 });
  });

  it('dentro del TTL, no vuelve a llamar a cargar()', async () => {
    const cache = new Map<string, EntradaCache<string>>();
    const cargar = vi.fn().mockResolvedValue('valor-1');

    await leerConCache(cache, 'clave', 1000, cargar, () => 0);
    const resultado = await leerConCache(cache, 'clave', 1000, cargar, () => 500);

    expect(resultado).toBe('valor-1');
    expect(cargar).toHaveBeenCalledTimes(1);
  });

  it('vencido el TTL, vuelve a llamar a cargar() y actualiza la caché', async () => {
    const cache = new Map<string, EntradaCache<string>>();
    const cargar = vi.fn().mockResolvedValueOnce('valor-1').mockResolvedValueOnce('valor-2');

    await leerConCache(cache, 'clave', 1000, cargar, () => 0);
    const resultado = await leerConCache(cache, 'clave', 1000, cargar, () => 2000);

    expect(resultado).toBe('valor-2');
    expect(cargar).toHaveBeenCalledTimes(2);
    expect(cache.get('clave')).toEqual({ valor: 'valor-2', timestampMs: 2000 });
  });

  it('si cargar() falla pero hay una copia previa, la sirve aunque esté vencida', async () => {
    const cache = new Map<string, EntradaCache<string>>();
    const cargar = vi
      .fn()
      .mockResolvedValueOnce('valor-bueno')
      .mockRejectedValueOnce(new Error('caído'));

    await leerConCache(cache, 'clave', 1000, cargar, () => 0);
    const resultado = await leerConCache(cache, 'clave', 1000, cargar, () => 999999);

    expect(resultado).toBe('valor-bueno');
    // La caché no se corrompe con el error: sigue siendo la copia buena.
    expect(cache.get('clave')).toEqual({ valor: 'valor-bueno', timestampMs: 0 });
  });

  it('si cargar() falla y no hay ninguna copia previa, relanza el error', async () => {
    const cache = new Map<string, EntradaCache<string>>();
    const cargar = vi.fn().mockRejectedValue(new Error('caído'));

    await expect(leerConCache(cache, 'clave', 1000, cargar, () => 0)).rejects.toThrow('caído');
    expect(cache.has('clave')).toBe(false);
  });

  it('claves distintas no se pisan entre sí', async () => {
    const cache = new Map<string, EntradaCache<string>>();

    await leerConCache(
      cache,
      'menu',
      1000,
      () => Promise.resolve('menu-1'),
      () => 0,
    );
    await leerConCache(
      cache,
      'contenido',
      1000,
      () => Promise.resolve('contenido-1'),
      () => 0,
    );

    expect(cache.get('menu')?.valor).toBe('menu-1');
    expect(cache.get('contenido')?.valor).toBe('contenido-1');
  });
});
