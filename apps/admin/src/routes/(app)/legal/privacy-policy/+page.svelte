<!--
  The privacy notice. A route declaration and nothing else — the editor is
  `lib/legal/legal-page-editor.svelte`, shared with whatever legal page comes
  next (a cookie notice, a service-wide terms page), which is why the page-shaped
  facts live here as props.
-->
<script lang="ts">
  import LegalPageEditor from '~/lib/legal/legal-page-editor.svelte';
</script>

<LegalPageEditor
  code="privacy-policy"
  title="Privacy policy"
  description="The notice published at /privacy-policy/, in every language the site serves."
  publicPath="/privacy-policy/"
/>
