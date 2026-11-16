<!--
  The privacy notice. A route declaration and nothing else — the editor is
  `lib/legal/legal-page-editor.svelte`, shared with whatever legal page comes
  next (a cookie notice, a service-wide terms page), which is why the page-shaped
  facts live here as props.
-->
<script lang="ts">
  import LegalPageEditor from '~/lib/legal/legal-page-editor.svelte';
  import { t } from '~/lib/ui-text';
</script>

<LegalPageEditor
  code="privacy-policy"
  title={t('legal.privacyTitle')}
  description={t('legal.privacyDescription')}
  publicPath="/privacy-policy/"
/>
